from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from ..config.settings import Settings

class EmbeddingManager:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=Settings.OPENAI_API_KEY
        )
    
    def create_vectorstore(self, documents):
        return FAISS.from_documents(documents, self.embeddings)