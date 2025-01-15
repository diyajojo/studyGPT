from typing import Dict, List
import json

def format_output(content: Dict) -> str:
    """Format the generated content for display"""
    return json.dumps(content, indent=2)

def validate_pdfs(paths: Dict[str, str]) -> bool:
    """Validate that all required PDFs exist"""
    required = ['syllabus', 'questions', 'notes']
    return all(paths.get(key) for key in required)