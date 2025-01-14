import PyPDF2
from typing import Optional

def extract_text_from_pdf(file_path: str) -> Optional[str]:
    """Extract text from PDF with error handling"""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text.strip()
    except Exception as e:
        print(f"Error reading PDF {file_path}: {str(e)}")
        return None