import os
from openai import OpenAI
from typing import Dict, List
import json
import PyPDF2
import re
import tiktoken
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
from config.settings import Settings

class ContentGenerator:
    def __init__(self, api_key: str, model="gpt-4", max_tokens=7000):
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.max_tokens = max_tokens
        self.encoding = tiktoken.encoding_for_model(model)

    def count_tokens(self, text: str) -> int:
        """Count tokens in text using the model's tokenizer"""
        return len(self.encoding.encode(text))

    def chunk_text(self, text: str, max_tokens: int = 3000) -> List[str]:
        """Split text into chunks that won't exceed token limit"""
        chunks = []
        current_chunk = ""
        current_tokens = 0
        
        sentences = re.split(r'([.!?])\s+', text)
        
        for i in range(0, len(sentences), 2):
            if i + 1 < len(sentences):
                sentence = sentences[i] + sentences[i+1]
            else:
                sentence = sentences[i]
                
            sentence_tokens = self.count_tokens(sentence)
            
            if current_tokens + sentence_tokens > max_tokens:
                chunks.append(current_chunk)
                current_chunk = sentence
                current_tokens = sentence_tokens
            else:
                current_chunk += " " + sentence if current_chunk else sentence
                current_tokens += sentence_tokens
        
        if current_chunk:
            chunks.append(current_chunk)
            
        return chunks

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text content from PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
            return text
        except Exception as e:
            print(f"Error reading PDF {pdf_path}: {str(e)}")
            return ""

    def extract_modules(self, syllabus_text: str) -> Dict[str, str]:
        """Extract module-wise content from syllabus"""
        module_pattern = r"Module\s*[-:]?\s*(\d+)\s*[-:]?\s*(.*?)(?=Module\s*[-:]?\s*\d+|$)"
        modules = {}
        
        matches = re.finditer(module_pattern, syllabus_text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            module_num = match.group(1)
            content = match.group(2).strip()
            modules[f"mod{module_num}"] = content
            
        return modules

    def generate_topics_for_chunk(self, module_key: str, chunk: str, questions_chunk: str) -> List[str]:
        """Generate topics for a single chunk of content"""
        prompt = f"""
        Based on this content, identify the most important topics for {module_key}.
        List only the topic names, no descriptions. Be specific and concise.

        Content:
        {chunk}

        Questions:
        {questions_chunk}

        Return only a JSON array of topic names.
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert in identifying key educational topics."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return []

    def generate_qa_for_chunk(self, chunk: str, questions_chunk: str, notes_chunk: str, num_pairs: int) -> List[Dict[str, str]]:
        """Generate Q&A pairs for a single chunk of content"""
        prompt = f"""
        Create {num_pairs} important question-answer pairs based on this content.
        Questions should be specific and answers should be concise but complete.

        Content:
        {chunk}

        Questions:
        {questions_chunk}

        Notes:
        {notes_chunk}

        Return as a JSON array of {num_pairs} objects with 'question' and 'answer' keys.
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert educator creating focused Q&A content."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return []

    def generate_important_topics(self, syllabus_text: str, questions_text: str) -> Dict[str, List[str]]:
        """Generate important topics for each module with chunking"""
        modules = self.extract_modules(syllabus_text)
        topics_by_module = {}

        questions_chunks = self.chunk_text(questions_text)
        
        for module_key, module_content in modules.items():
            content_chunks = self.chunk_text(module_content)
            all_topics = set()
            
            for content_chunk in content_chunks:
                for questions_chunk in questions_chunks:
                    chunk_topics = self.generate_topics_for_chunk(
                        module_key, content_chunk, questions_chunk
                    )
                    all_topics.update(chunk_topics)
            
            topics_by_module[module_key] = list(all_topics)

        return topics_by_module

    def generate_module_qa(self, module_content: str, questions_text: str, notes_text: str) -> List[Dict[str, str]]:
        """Generate 10 Q&A pairs for a module with chunking"""
        content_chunks = self.chunk_text(module_content)
        questions_chunks = self.chunk_text(questions_text)
        notes_chunks = self.chunk_text(notes_text)
        
        qa_pairs = []
        pairs_needed = 10
        
        for i, content_chunk in enumerate(content_chunks):
            if len(qa_pairs) >= 10:
                break
                
            questions_chunk = questions_chunks[i % len(questions_chunks)]
            notes_chunk = notes_chunks[i % len(notes_chunks)]
            
            chunk_pairs = self.generate_qa_for_chunk(
                content_chunk, 
                questions_chunk, 
                notes_chunk,
                min(5, pairs_needed)  # Generate up to 5 pairs per chunk
            )
            
            qa_pairs.extend(chunk_pairs)
            pairs_needed -= len(chunk_pairs)
            
            if pairs_needed <= 0:
                break

        return qa_pairs[:10]  # Ensure exactly 10 pairs

    def generate_flashcards(self, notes_text: str) -> List[Dict[str, str]]:
        """Generate 10 flashcard Q&A pairs from notes with chunking"""
        notes_chunks = self.chunk_text(notes_text)
        flashcards = []
        cards_needed = 10
        
        for chunk in notes_chunks:
            if len(flashcards) >= 10:
                break
                
            prompt = f"""
            Create {min(5, cards_needed)} flashcard-style question-answer pairs from these notes.
            Focus on key concepts and definitions. Keep both questions and answers concise.

            Notes:
            {chunk}

            Return as a JSON array of objects with 'question' and 'answer' keys.
            """

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in creating educational flashcards."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )

            try:
                chunk_cards = json.loads(response.choices[0].message.content)
                flashcards.extend(chunk_cards)
                cards_needed -= len(chunk_cards)
            except json.JSONDecodeError:
                continue

        return flashcards[:10]  # Ensure exactly 10 flashcards

    def generate_all_content(self, syllabus_path: str, questions_path: str, notes_path: str) -> Dict:
        """Generate complete content including topics, Q&A, and flashcards"""
        # Extract text from PDFs
        syllabus_text = self.extract_text_from_pdf(syllabus_path)
        questions_text = self.extract_text_from_pdf(questions_path)
        notes_text = self.extract_text_from_pdf(notes_path)

        # Generate content
        important_topics = self.generate_important_topics(syllabus_text, questions_text)
        
        # Get modules and generate Q&A pairs
        modules = self.extract_modules(syllabus_text)
        important_qna = {}
        for module_key, module_content in modules.items():
            important_qna[module_key] = self.generate_module_qa(
                module_content, questions_text, notes_text
            )

        # Generate flashcards
        flashcards = self.generate_flashcards(notes_text)

        # Compile final output
        output = {
            "important_topics": important_topics,
            "important_qna": important_qna,
            "flashcards": flashcards
        }

        return output

def main():
    api_key = Settings.OPENAI_API_KEY
    syllabus_path = os.path.join(BASE_DIR,"DBMS Syllabus.pdf")
    questions_path = os.path.join(BASE_DIR,"DBMS Jan 2024.pdf")
    notes_path = os.path.join(BASE_DIR,"mod1.pdf")

    generator = ContentGenerator(api_key)
    content = generator.generate_all_content(syllabus_path, questions_path, notes_path)

    # Save output to JSON file
    with open("output.json", "w", encoding='utf-8') as f:
        json.dump(content, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()