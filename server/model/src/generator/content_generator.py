from typing import Dict, List
import json
from openai import OpenAI
import tiktoken
from concurrent.futures import ThreadPoolExecutor, as_completed
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
        self.max_topics = 5
        self.max_qna = 5
        self.flashcards_per_module = 5
        self._token_count_cache = {}
        self._context_cache = {}
        
    def count_tokens(self, text: str) -> int:
        if text not in self._token_count_cache:
            self._token_count_cache[text] = len(self.encoding.encode(text))
        return self._token_count_cache[text]

    def truncate_text(self, text: str, max_tokens: int) -> str:
        tokens = self.encoding.encode(text)
        if len(tokens) > max_tokens:
            return self.encoding.decode(tokens[:max_tokens])
        return text

    def chunk_content(self, content: str, max_tokens: int) -> List[str]:
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

    def get_cached_context(self, chunk: str, module_content: str = "") -> str:
        cache_key = f"{chunk}_{hash(module_content)}"
        if cache_key not in self._context_cache:
            context = self.vector_store.get_relevant_context(chunk)
            if module_content:
                context = f"{module_content}\n\n{context}"
            self._context_cache[cache_key] = context
        return self._context_cache[cache_key]

    def process_chunk(self, chunk_data: Dict) -> Dict:
        """Process a single chunk for either topics or QA pairs"""
        chunk = chunk_data['chunk']
        chunk_type = chunk_data['type']
        module_key = chunk_data.get('module_key')
        num_pairs = chunk_data.get('num_pairs', 5)

        try:
            # Get and prepare context
            context = self.get_cached_context(chunk)
            context = self.truncate_text(context, self.max_chunk_size // 2)
            chunk = self.truncate_text(chunk, self.max_chunk_size // 2)

            # Calculate available tokens
            system_message = ("You are an expert in identifying key educational topics." 
                            if chunk_type == 'topics' else 
                            "You are an expert educator creating focused Q&A content.")
            
            system_tokens = self.count_tokens(system_message)
            
            # Prepare the appropriate prompt
            if chunk_type == 'topics':
                prompt = TOPIC_PROMPT.format(
                    module_key=module_key,
                    content=chunk,
                    context=context
                )
            else:  # QA pairs
                prompt = QA_PROMPT.format(
                    num_pairs=num_pairs,
                    content=chunk,
                    context=context
                )

            # Ensure we don't exceed token limits
            available_tokens = self.max_context_length - system_tokens - 500
            prompt = self.truncate_text(prompt, available_tokens)

            # Make the API call
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            # Parse and return results
            result = json.loads(response.choices[0].message.content)
            return {
                'type': chunk_type,
                'module_key': module_key,
                'result': result
            }

        except Exception as e:
            print(f"Error in process_chunk: {str(e)}")
            return {
                'type': chunk_type,
                'module_key': module_key,
                'result': [] if chunk_type == 'topics' else [{"question": "", "answer": ""}]
            }

    def generate_module_flashcards(self, module_key: str, module_content: str, notes_text: str, 
                                 existing_qa: List[Dict[str, str]] = None) -> List[Dict[str, str]]:
        """Generate flashcards specific to a module, ensuring they're different from existing QA pairs"""
        context = self.get_cached_context(module_content, notes_text)
        context = self.truncate_text(context, self.max_chunk_size)
        
        # If we have existing QA pairs, include them to avoid duplication
        existing_qa_prompt = ""
        if existing_qa:
            existing_questions = [qa['question'] for qa in existing_qa]
            existing_qa_prompt = f"""
            Please ensure the flashcards are different from these existing questions:
            {json.dumps(existing_questions)}
            """

        prompt = f"""Generate exactly {self.flashcards_per_module} flashcard pairs for module {module_key}. 
        Use only the content and topics from this specific module.
        Make sure each flashcard tests a different concept.
        Focus on key terminology, definitions, and core concepts.
        {existing_qa_prompt}
        Module content: {module_content}
        Additional context: {context}
        
        Return the flashcards in JSON format with 'question' and 'answer' fields."""

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
            print(f"Error generating flashcards for module {module_key}: {str(e)}")
            # Generate alternative flashcards from module content
            try:
                # Create a different prompt focusing on terminology and basic concepts
                backup_prompt = f"""Generate exactly {self.flashcards_per_module} basic terminology flashcards for module {module_key}.
                Focus on definitions, key terms, and fundamental concepts.
                Ensure these are different from any existing Q&A pairs.
                {existing_qa_prompt}
                Content: {module_content}
                
                Return the flashcards in JSON format with 'question' and 'answer' fields."""
                
                backup_response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an expert in creating terminology-focused flashcards."},
                        {"role": "user", "content": backup_prompt}
                    ],
                    temperature=0.8,  # Slightly higher temperature for more variety
                    max_tokens=1000
                )
                return json.loads(backup_response.choices[0].message.content)
            except Exception as backup_error:
                print(f"Backup flashcard generation failed for module {module_key}: {str(backup_error)}")
                return []

    def process_content_parallel(self, chunk_data: Dict) -> Dict:
        """Process content chunks in parallel"""
        try:
            return self.process_chunk(chunk_data)
        except Exception as e:
            print(f"Error in parallel processing: {str(e)}")
            return {
                'type': chunk_data['type'],
                'module_key': chunk_data['module_key'],
                'result': [] if chunk_data['type'] == 'topics' else [{"question": "", "answer": ""}]
            }

    def generate_all_content(self, syllabus_text: str, questions_texts: List[str], notes_texts: Dict[str, str]) -> Dict:
        """Generate complete content using optimized parallel processing"""
        # Initialize vector store with module-specific organization
        self.vector_store.initialize(
            texts=[syllabus_text] + list(questions_texts) + list(notes_texts.values()),
            sources=["syllabus"] + ["questions"] * len(questions_texts) + ["notes"] * len(notes_texts)
        )

        # Extract modules
        modules = extract_modules(syllabus_text)

        # Prepare chunks for parallel processing
        all_chunks = []
        for module_key, module_content in modules.items():
            chunks = self.chunk_content(module_content, self.max_chunk_size)
            for chunk in chunks:
                all_chunks.extend([
                    {'chunk': chunk, 'type': 'topics', 'module_key': module_key},
                    {'chunk': chunk, 'type': 'qa', 'module_key': module_key, 'num_pairs': self.max_qna}
                ])

        # Process content in parallel with improved error handling
        results = {}
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_chunk = {executor.submit(self.process_content_parallel, chunk): chunk 
                             for chunk in all_chunks}
            
            for future in as_completed(future_to_chunk):
                try:
                    result = future.result()
                    if result['module_key'] not in results:
                        results[result['module_key']] = {'topics': set(), 'qa': []}
                    
                    if result['type'] == 'topics':
                        results[result['module_key']]['topics'].update(result['result'])
                    else:  # qa
                        results[result['module_key']]['qa'].extend(result['result'])
                except Exception as e:
                    print(f"Error processing future: {str(e)}")

        # Generate module-specific flashcards in parallel with existing QA reference
        flashcards = {}
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_module = {
                executor.submit(
                    self.generate_module_flashcards,
                    module_key,
                    module_content,
                    notes_texts.get(module_key, ""),
                    results[module_key]['qa'] if module_key in results else None
                ): module_key
                for module_key, module_content in modules.items()
            }
            
            for future in as_completed(future_to_module):
                module_key = future_to_module[future]
                try:
                    flashcards[module_key] = future.result()
                except Exception as e:
                    print(f"Error generating flashcards for module {module_key}: {str(e)}")
                    flashcards[module_key] = []

        # Format final results
        return {
            "important_topics": {k: list(v['topics'])[:self.max_topics] for k, v in results.items()},
            "important_qna": {k: v['qa'][:self.max_qna] for k, v in results.items()},
            "flashcards": flashcards
        }