from typing import Dict, List
import json
from openai import OpenAI
import tiktoken
from concurrent.futures import ThreadPoolExecutor
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
        self.max_context_length = 7000
        self.max_chunk_size = 3000
        self.max_topics = 5  # Limit for topics per module
        self.max_qna = 5     # Limit for Q&A pairs per module
        # Caching
        self._token_count_cache = {}
        self._context_cache = {}
        
    def count_tokens(self, text: str) -> int:
        """Cached token counting"""
        if text not in self._token_count_cache:
            self._token_count_cache[text] = len(self.encoding.encode(text))
        return self._token_count_cache[text]

    def truncate_text(self, text: str, max_tokens: int) -> str:
        """Truncate text to fit within token limit"""
        tokens = self.encoding.encode(text)
        if len(tokens) > max_tokens:
            return self.encoding.decode(tokens[:max_tokens])
        return text

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

    def get_cached_context(self, chunk: str) -> str:
        """Get context with caching"""
        if chunk not in self._context_cache:
            self._context_cache[chunk] = self.vector_store.get_relevant_context(chunk)
        return self._context_cache[chunk]

    def select_top_topics(self, topics: List[str], max_count: int = 5) -> List[str]:
        """Select the most important topics based on their relevance."""
        return topics[:max_count]

    def select_top_qna(self, qna_pairs: List[Dict[str, str]], max_count: int = 5) -> List[Dict[str, str]]:
        """Select the most important Q&A pairs."""
        return qna_pairs[:max_count]

    def process_chunk(self, chunk_data: Dict) -> Dict:
        """Process a single chunk for either topics or QA pairs"""
        chunk = chunk_data['chunk']
        chunk_type = chunk_data['type']
        module_key = chunk_data.get('module_key')
        num_pairs = chunk_data.get('num_pairs', 5)

        context = self.get_cached_context(chunk)
        context = self.truncate_text(context, self.max_chunk_size // 2)
        chunk = self.truncate_text(chunk, self.max_chunk_size // 2)

        # Calculate available tokens
        system_message_tokens = self.count_tokens(
            "You are an expert in identifying key educational topics." 
            if chunk_type == 'topics' else 
            "You are an expert educator creating focused Q&A content."
        )

        base_prompt = (
            TOPIC_PROMPT.format(module_key=module_key, content="", context="")
            if chunk_type == 'topics' else
            QA_PROMPT.format(num_pairs=num_pairs, content="", context="")
        )
        base_prompt_tokens = self.count_tokens(base_prompt)
        
        available_tokens = self.max_context_length - system_message_tokens - base_prompt_tokens - 500

        # Ensure content fits in available tokens
        if self.count_tokens(chunk) + self.count_tokens(context) > available_tokens:
            max_chunk_tokens = available_tokens // 2
            max_context_tokens = available_tokens // 2
            chunk = self.truncate_text(chunk, max_chunk_tokens)
            context = self.truncate_text(context, max_context_tokens)

        if chunk_type == 'topics':
            prompt = TOPIC_PROMPT.format(
                module_key=module_key,
                content=chunk,
                context=context
            )
            system_content = "You are an expert in identifying key educational topics."
        else:  # QA pairs
            prompt = QA_PROMPT.format(
                num_pairs=num_pairs,
                content=chunk,
                context=context
            )
            system_content = "You are an expert educator creating focused Q&A content."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            result = json.loads(response.choices[0].message.content)
            return {
                'type': chunk_type,
                'module_key': module_key,
                'result': result
            }
        except Exception as e:
            print(f"Error processing chunk: {str(e)}")
            return {
                'type': chunk_type,
                'module_key': module_key,
                'result': [] if chunk_type == 'topics' else [{"question": "", "answer": ""}]
            }

    def generate_flashcards(self, content: str, num_cards: int = 10) -> List[Dict[str, str]]:
        """Generate flashcards using RAG"""
        content = self.truncate_text(content, self.max_chunk_size)
        context = self.get_cached_context(content)
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

    def generate_all_content(self, syllabus_text: str, questions_texts: List[str], notes_texts: List[str]) -> Dict:
        """Generate complete content using parallel processing with limited results"""
        # Merge sources first
        merged_questions = "\n\n".join(questions_texts)
        merged_notes = "\n\n".join(notes_texts)

        # Initialize vector store once
        self.vector_store.initialize(
            texts=[syllabus_text, merged_questions, merged_notes],
            sources=["syllabus", "questions", "notes"]
        )

        # Extract modules
        modules = extract_modules(syllabus_text)

        # Prepare all chunks for parallel processing
        all_chunks = []
        for module_key, module_content in modules.items():
            chunks = self.chunk_content(module_content, self.max_chunk_size)
            for chunk in chunks:
                # Add topics task
                all_chunks.append({
                    'chunk': chunk,
                    'type': 'topics',
                    'module_key': module_key
                })
                # Add QA pairs task
                all_chunks.append({
                    'chunk': chunk,
                    'type': 'qa',
                    'module_key': module_key,
                    'num_pairs': max(1, 10 // len(chunks))  # Distribute QA pairs
                })

        # Process chunks in parallel
        with ThreadPoolExecutor(max_workers=5) as executor:
            chunk_results = list(executor.map(self.process_chunk, all_chunks))

        # Organize results
        important_topics = {module_key: set() for module_key in modules.keys()}
        important_qna = {module_key: [] for module_key in modules.keys()}

        for result in chunk_results:
            if result['type'] == 'topics':
                important_topics[result['module_key']].update(result['result'])
            else:  # QA pairs
                important_qna[result['module_key']].extend(result['result'])

        # Convert topic sets to lists and limit results
        important_topics = {
            k: self.select_top_topics(list(v), self.max_topics) 
            for k, v in important_topics.items()
        }

        # Limit QA pairs
        important_qna = {
            k: self.select_top_qna(v, self.max_qna)
            for k, v in important_qna.items()
        }

        # Generate flashcards and organize by module
        all_flashcards = self.generate_flashcards(merged_notes)
        module_flashcards = {}
        
        # Distribute flashcards across modules
        cards_per_module = len(all_flashcards) // 5
        for i in range(5):
            module_key = f"mod{i+1}"
            start_idx = i * cards_per_module
            end_idx = start_idx + cards_per_module
            module_flashcards[module_key] = all_flashcards[start_idx:end_idx][:self.max_qna]

        return {
            "important_topics": important_topics,
            "important_qna": important_qna,
            "flashcards": module_flashcards
        }