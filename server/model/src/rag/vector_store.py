from typing import List, Dict
import faiss
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from .embeddings import get_embeddings
from src.config import Config
class VectorStore:
    def __init__(self):
        self.embeddings = get_embeddings()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=Config.CHUNK_SIZE,
            chunk_overlap=Config.CHUNK_OVERLAP
        )
        self.vectorstore = None

    def initialize(self, texts: List[str], sources: List[str]):
        """Initialize vector store with documents"""
        all_chunks = []
        all_metadatas = []
        
        for text, source in zip(texts, sources):
            if text:  # Only process non-empty texts
                chunks = self.text_splitter.split_text(text)
                metadatas = [{"source": source} for _ in chunks]
                all_chunks.extend(chunks)
                all_metadatas.extend(metadatas)
        
        if all_chunks:
            self.vectorstore = FAISS.from_texts(
                all_chunks,
                self.embeddings,
                metadatas=all_metadatas
            )

    def get_relevant_context(self, query: str, k: int = 3) -> str:
        """Retrieve relevant context"""
        if not self.vectorstore:
            return ""
        docs = self.vectorstore.similarity_search(query, k=k)
        return "\n\n".join(doc.page_content for doc in docs)
