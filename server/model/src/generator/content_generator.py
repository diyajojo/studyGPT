from typing import Dict, List
import json
from openai import OpenAI
import tiktoken
from src.config import Config
from src.utils.text_utils import extract_modules
from src.rag.vector_store import VectorStore
from .prompts import TOPIC_PROMPT, QA_PROMPT, FLASHCARD_PROMPT

class ContentGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)
        self.model = Config.MODEL_NAME
        self.encoding = tiktoken.encoding_for_model(self.model)
        self.vector_store = VectorStore()
        # Set conservative max tokens to leave room for model responses
        self.max_context_length = 7000  # Leave ~1000 tokens for response
        self.max_chunk_size = 3000      # Smaller chunks for safer processing

    def count_tokens(self, text: str) -> int:
        """Count the number of tokens in a text string using the model's encoding."""
        return len(self.encoding.encode(text))

    def truncate_text(self, text: str, max_tokens: int) -> str:
        """Truncate text to fit within token limit"""
        tokens = self.encoding.encode(text)
        if len(tokens) > max_tokens:
            return self.encoding.decode(tokens[:max_tokens])
        return text

    def generate_topics(self, module_key: str, content: str) -> List[str]:
        """Generate topics using RAG with chunking"""
        chunks = self.chunk_content(content, self.max_chunk_size)
        all_topics = set()
        
        for chunk in chunks:
            # Get smaller context for each chunk
            context = self.vector_store.get_relevant_context(chunk)
            context = self.truncate_text(context, self.max_chunk_size // 2)
            chunk = self.truncate_text(chunk, self.max_chunk_size // 2)
            
            # Calculate available tokens for prompt
            system_message_tokens = self.count_tokens("You are an expert in identifying key educational topics.")
            base_prompt_tokens = self.count_tokens(TOPIC_PROMPT.format(
                module_key=module_key,
                content="",
                context=""
            ))
            available_tokens = self.max_context_length - system_message_tokens - base_prompt_tokens - 500  # Buffer

            # Ensure content fits in available tokens
            if self.count_tokens(chunk) + self.count_tokens(context) > available_tokens:
                # Prioritize chunk content over context
                max_chunk_tokens = available_tokens // 2
                max_context_tokens = available_tokens // 2
                chunk = self.truncate_text(chunk, max_chunk_tokens)
                context = self.truncate_text(context, max_context_tokens)
            
            prompt = TOPIC_PROMPT.format(
                module_key=module_key,
                content=chunk,
                context=context
            )

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an expert in identifying key educational topics."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                chunk_topics = json.loads(response.choices[0].message.content)
                all_topics.update(chunk_topics)
            except Exception as e:
                print(f"Error generating topics for chunk: {str(e)}")
                continue

        return list(all_topics)

    def chunk_content(self, content: str, max_tokens: int) -> List[str]:
        """Split content into chunks that won't exceed token limit"""
        tokens = self.encoding.encode(content)
        chunks = []
        current_chunk = []
        current_length = 0
        
        for token in tokens:
            if current_length + 1 > max_tokens:
                chunks.append(self.encoding.decode(current_chunk))
                current_chunk = [token]
                current_length = 1
            else:
                current_chunk.append(token)
                current_length += 1
        
        if current_chunk:
            chunks.append(self.encoding.decode(current_chunk))
        
        return chunks

    def generate_qa_pairs(self, content: str, num_pairs: int = 10) -> List[Dict[str, str]]:
        """Generate Q&A pairs using RAG with chunking"""
        chunks = self.chunk_content(content, self.max_chunk_size)
        all_qa_pairs = []
        pairs_per_chunk = max(1, num_pairs // len(chunks))
        
        for chunk in chunks:
            context = self.vector_store.get_relevant_context(chunk)
            context = self.truncate_text(context, self.max_chunk_size // 2)
            chunk = self.truncate_text(chunk, self.max_chunk_size // 2)
            
            # Calculate available tokens
            system_message_tokens = self.count_tokens("You are an expert educator creating focused Q&A content.")
            base_prompt_tokens = self.count_tokens(QA_PROMPT.format(
                num_pairs=pairs_per_chunk,
                content="",
                context=""
            ))
            available_tokens = self.max_context_length - system_message_tokens - base_prompt_tokens - 500

            # Ensure content fits
            if self.count_tokens(chunk) + self.count_tokens(context) > available_tokens:
                max_chunk_tokens = available_tokens // 2
                max_context_tokens = available_tokens // 2
                chunk = self.truncate_text(chunk, max_chunk_tokens)
                context = self.truncate_text(context, max_context_tokens)
            
            prompt = QA_PROMPT.format(
                num_pairs=pairs_per_chunk,
                content=chunk,
                context=context
            )

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an expert educator creating focused Q&A content."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                chunk_pairs = json.loads(response.choices[0].message.content)
                all_qa_pairs.extend(chunk_pairs)
            except Exception as e:
                print(f"Error generating QA pairs for chunk: {str(e)}")
                continue

        return all_qa_pairs[:num_pairs]

    def generate_flashcards(self, content: str, num_cards: int = 10) -> List[Dict[str, str]]:
        """Generate flashcards using RAG"""
        # Truncate content if needed
        content = self.truncate_text(content, self.max_chunk_size)
        context = self.vector_store.get_relevant_context(content)
        context = self.truncate_text(context, self.max_chunk_size // 2)
        
        # Calculate available tokens
        system_message_tokens = self.count_tokens("You are an expert in creating educational flashcards.")
        base_prompt_tokens = self.count_tokens(FLASHCARD_PROMPT.format(
            num_cards=num_cards,
            content="",
            context=""
        ))
        available_tokens = self.max_context_length - system_message_tokens - base_prompt_tokens - 500

        # Ensure content fits
        if self.count_tokens(content) + self.count_tokens(context) > available_tokens:
            max_content_tokens = available_tokens // 2
            max_context_tokens = available_tokens // 2
            content = self.truncate_text(content, max_content_tokens)
            context = self.truncate_text(context, max_context_tokens)

        prompt = FLASHCARD_PROMPT.format(
            num_cards=num_cards,
            content=content,
            context=context
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in creating educational flashcards."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error generating flashcards: {str(e)}")
            return []

    def generate_all_content(self, syllabus_text: str, questions_text: str, notes_text: str) -> Dict:
        """Generate complete content using RAG"""
        # Initialize vector store
        self.vector_store.initialize(
            texts=[syllabus_text, questions_text, notes_text],
            sources=["syllabus", "questions", "notes"]
        )

        # Extract modules
        modules = extract_modules(syllabus_text)
        
        # Generate content
        important_topics = {}
        important_qna = {}

        for module_key, module_content in modules.items():
            important_topics[module_key] = self.generate_topics(module_key, module_content)
            important_qna[module_key] = self.generate_qa_pairs(module_content)

        flashcards = self.generate_flashcards(notes_text)

        return {
            "important_topics": important_topics,
            "important_qna": important_qna,
            "flashcards": flashcards
        }