import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__),"..", ".env")
load_dotenv()

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    MODEL_NAME = "gpt-4"
    MAX_TOKENS = 6000
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200
    DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pdf")