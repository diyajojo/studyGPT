import os
import json
from typing import Dict
from model.src.config import Config
from model.src.utils.pdf_utils import extract_text_from_pdf
from model.src.generator.content_generator import ContentGenerator
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def load_pdf(file_path: str) -> str:
    """Extract text from a single PDF file with error handling"""
    try:
        text = extract_text_from_pdf(file_path)
        return text if text else ""
    except Exception as e:
        print(f"Error reading PDF {file_path}: {str(e)}")
        return ""

def load_module_notes(notes_files: list) -> Dict[str, str]:
    """Load notes files and organize them by module"""
    module_notes = {}
    for file_path in notes_files:
        # Extract module number from filename (assuming format modX.pdf)
        module_key = os.path.splitext(os.path.basename(file_path))[0]
        if not module_key.startswith('mod'):
            continue
        
        text = load_pdf(file_path)
        if text:
            module_notes[module_key] = text
    
    return module_notes

def main():
    # Define paths
    syllabus_files = [
        os.path.join(Config.DATA_DIR, "DBMS Syllabus.pdf")
    ]
    
    questions_files = [
        os.path.join(Config.DATA_DIR, "qp1.pdf"),
        os.path.join(Config.DATA_DIR, "qp2.pdf"),
        os.path.join(Config.DATA_DIR, "qp3.pdf"),
        os.path.join(Config.DATA_DIR, "qp4.pdf"),
    ]
    
    notes_files = [
        os.path.join(Config.DATA_DIR, "mod1.pdf"),
        os.path.join(Config.DATA_DIR, "mod2.pdf"),
        os.path.join(Config.DATA_DIR, "mod3.pdf"),
        os.path.join(Config.DATA_DIR, "mod4.pdf"),
        os.path.join(Config.DATA_DIR, "mod5.pdf"),
    ]

    # Load content with improved organization
    syllabus_text = load_pdf(syllabus_files[0])
    questions_texts = [load_pdf(qf) for qf in questions_files]
    module_notes = load_module_notes(notes_files)

    if not syllabus_text:
        print("Error: Failed to read syllabus file")
        return

    if not any(questions_texts):
        print("Warning: No question papers could be read")
        questions_texts = [""]  # Provide empty fallback

    if not module_notes:
        print("Error: Failed to read any module notes")
        return

    # Generate content
    generator = ContentGenerator()
    content = generator.generate_all_content(syllabus_text, questions_texts, module_notes)

    # Save output
    output_path = os.path.join(os.path.dirname(__file__), "output.json")
    try:
        with open(output_path, "w", encoding='utf-8') as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
        print(f"Successfully generated content and saved to {output_path}")
    except Exception as e:
        print(f"Error saving output: {str(e)}")

if __name__ == "__main__":
    main()