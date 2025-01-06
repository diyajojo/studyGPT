import os
from dotenv import load_dotenv

print("Current working directory:", os.getcwd())
load_dotenv()
print("API Key loaded:", os.getenv("OPENAI_API_KEY"))

class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    MODEL_NAME = "gpt-3.5-turbo"
    TEMPERATURE = 0.7
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200