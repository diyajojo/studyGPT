from langchain.text_splitter import RecursiveCharacterTextSplitter
from ..config.settings import Settings

def get_text_splitter():
    return RecursiveCharacterTextSplitter(
        chunk_size=Settings.CHUNK_SIZE,
        chunk_overlap=Settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
    )