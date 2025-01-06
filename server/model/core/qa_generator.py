# core/qa_generator.py
print("Loading qa_generator.py...")

from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
import re
from ..config.settings import Settings
from ..core.pdf_processor import PDFProcessor
from ..core.embeddings import EmbeddingManager
from ..utils.prompt_templates import QAPrompts

print("Imports completed")

class QAGenerator:
    print("Defining QAGenerator class...")
    def __init__(self):
        print("Initializing QAGenerator...")
        # Initialize the language model with settings
        self.llm = ChatOpenAI(
            temperature=Settings.TEMPERATURE,
            model=Settings.MODEL_NAME,
            openai_api_key=Settings.OPENAI_API_KEY
        )
        
        # Initialize PDF processor and embedding manager
        self.pdf_processor = PDFProcessor()
        self.embedding_manager = EmbeddingManager()
        
        # Initialize chains for different question types
        self.syllabus_chain = LLMChain(
            llm=self.llm, 
            prompt=QAPrompts.SYLLABUS_PROMPT
        )
        self.content_chain = LLMChain(
            llm=self.llm, 
            prompt=QAPrompts.CONTENT_PROMPT
        )
    
    def is_syllabus(self, text):
        """
        Detect if the given text is from a syllabus based on common patterns
        """
        syllabus_indicators = [
            r'\b(course|syllabus|curriculum|topics?|modules?|units?)\b',
            r'\b\d+\.\s+[A-Z]',  # Numbered items starting with capital letters
            r'\b(prerequisite|learning outcomes|objectives)\b'
        ]
        
        matches = sum(1 for pattern in syllabus_indicators 
                     if re.search(pattern, text, re.IGNORECASE))
        return matches >= 2
    
    def extract_topics(self, text):
        """
        Extract topics from syllabus text
        Returns a list of topics in order
        """
        # Look for numbered or bulleted items
        topics = re.findall(r'(?:\d+\.|\-|\*)\s*([^.\n]+)', text)
        return [topic.strip() for topic in topics if topic.strip()]
    
    def generate_syllabus_questions(self, text):
        """
        Generate questions based on syllabus topics
        Maintains the order of topics from syllabus
        """
        topics = self.extract_topics(text)
        all_qa_pairs = []
        
        for topic in topics:
            try:
                # Generate questions for each topic
                result = self.syllabus_chain.run(topic)
                # Convert string representation of list to actual list
                qa_pairs = eval(result)
                # Add topic information to each QA pair
                for qa in qa_pairs:
                    qa['topic'] = topic
                all_qa_pairs.extend(qa_pairs)
            except Exception as e:
                print(f"Error generating questions for topic {topic}: {str(e)}")
                continue
                
        return all_qa_pairs
    
    def generate_content_questions(self, chunks):
        """
        Generate questions from content chunks
        Uses semantic search to ensure relevance
        """
        all_qa_pairs = []
        
        # Create vector store for semantic search
        vectorstore = self.embedding_manager.create_vectorstore(chunks)
        
        for chunk in chunks:
            try:
                # Find similar chunks for context
                similar_chunks = vectorstore.similarity_search(
                    chunk.page_content,
                    k=2
                )
                
                # Combine similar chunks for better context
                context = " ".join([c.page_content for c in similar_chunks])
                
                # Generate questions using the enhanced context
                result = self.content_chain.run(context)
                qa_pairs = eval(result)
                
                # Add source information
                for qa in qa_pairs:
                    qa['source_page'] = chunk.metadata.get('page', 'unknown')
                
                all_qa_pairs.extend(qa_pairs)
            except Exception as e:
                print(f"Error generating questions for chunk: {str(e)}")
                continue
        
        return all_qa_pairs
    
    def generate_qa_pairs(self, pdf_path):
        """
        Main method to generate QA pairs from a PDF
        Automatically detects if it's a syllabus or content
        """
        # Process the PDF
        chunks = self.pdf_processor.process_pdf(pdf_path)
        
        # Combine all text for syllabus detection
        full_text = " ".join([chunk.page_content for chunk in chunks])
        
        # Generate questions based on content type
        if self.is_syllabus(full_text):
            return self.generate_syllabus_questions(full_text)
        else:
            return self.generate_content_questions(chunks)
    
    def filter_duplicate_questions(self, qa_pairs, similarity_threshold=0.85):
        """
        Remove similar questions using embeddings
        """
        if not qa_pairs:
            return []
            
        # Get embeddings for all questions
        questions = [qa['question'] for qa in qa_pairs]
        question_embeddings = self.embedding_manager.embeddings.embed_documents(questions)
        
        # Filter duplicates
        unique_indices = []
        for i in range(len(questions)):
            is_unique = True
            for j in unique_indices:
                similarity = self.compute_similarity(
                    question_embeddings[i],
                    question_embeddings[j]
                )
                if similarity > similarity_threshold:
                    is_unique = False
                    break
            if is_unique:
                unique_indices.append(i)
        
        return [qa_pairs[i] for i in unique_indices]
    
    @staticmethod
    def compute_similarity(vec1, vec2):
        """
        Compute cosine similarity between two vectors
        """
        import numpy as np
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))