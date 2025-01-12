import os
import json
from src.config import Config
from src.utils.pdf_utils import extract_text_from_pdf
from src.generator.content_generator import ContentGenerator
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    # Load PDF files
    syllabus_path = os.path.join(Config.DATA_DIR, "DBMS Syllabus.pdf")
    questions_path = os.path.join(Config.DATA_DIR, "DBMS Jan 2024.pdf")
    notes_path = os.path.join(Config.DATA_DIR, "mod1.pdf")

    # Extract text from PDFs
    syllabus_text = extract_text_from_pdf(syllabus_path)
    questions_text = extract_text_from_pdf(questions_path)
    notes_text = extract_text_from_pdf(notes_path)

    if not all([syllabus_text, questions_text, notes_text]):
        print("Error: Failed to read one or more PDF files")
        return

    # Generate content
    generator = ContentGenerator()
    content = generator.generate_all_content(syllabus_text, questions_text, notes_text)

    # Save output
    output_path = os.path.join(os.path.dirname(__file__), "output.json")
    with open(output_path, "w", encoding='utf-8') as f:
        json.dump(content, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()