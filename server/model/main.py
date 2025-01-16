import os
import json
from model.src.config import Config
from model.src.utils.pdf_utils import extract_text_from_pdf
from model.src.generator.content_generator import ContentGenerator
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def load_multiple_pdfs(file_paths):
    """Extract and concatenate text from multiple PDF files."""
    all_text = ""
    for path in file_paths:
        text = extract_text_from_pdf(path)
        if text:     
            all_text += f"\n{text}"  # Separate files with a newline
        else:
            print(f"Error: Failed to read PDF file at {path}")
    return all_text

def main():
    # Define paths to PDF directories or files
    syllabus_files = [
        os.path.join(Config.DATA_DIR, "DBMS Syllabus.pdf ")
        # Add more syllabus files if needed
    ]
    questions_files = [
        os.path.join(Config.DATA_DIR, "DBMS Jan 2024.pdf")
        # Add more previous year question paper files here
    ]
    notes_files = [
        os.path.join(Config.DATA_DIR, "mod1.pdf"),
        os.path.join(Config.DATA_DIR, "2 Mod DBMS.pdf"),
        # Add more notes files here
    ]

    # Extract text from multiple PDFs
    syllabus_text = load_multiple_pdfs(syllabus_files)
    questions_text = load_multiple_pdfs(questions_files)
    notes_text = load_multiple_pdfs(notes_files)

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
