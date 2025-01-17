from pdfminer.high_level import extract_text
from typing import Optional
import logging
def extract_text_from_pdf(file_path: str) -> Optional[str]:
    try:
        text = extract_text(file_path)
        return text.strip()
    except Exception as e:
        logging.error(f"Error reading PDF {file_path}: {str(e)}")
        return None