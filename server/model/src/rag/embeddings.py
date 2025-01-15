from langchain_openai import OpenAIEmbeddings
from model.src.config import Config

def get_embeddings():
    """Initialize OpenAI embeddings"""
    return OpenAIEmbeddings(
        openai_api_key=Config.OPENAI_API_KEY
    )