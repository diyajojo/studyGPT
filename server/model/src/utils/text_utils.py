import re
from typing import Dict, List

def extract_modules(text: str) -> Dict[str, str]:
    """Extract modules from text content"""
    module_pattern = r"Module\s*[-:]?\s*(\d+)\s*[-:]?\s*(.*?)(?=Module\s*[-:]?\s*\d+|$)"
    modules = {}
    
    matches = re.finditer(module_pattern, text, re.DOTALL | re.IGNORECASE)
    for match in matches:
        module_num = match.group(1)
        content = match.group(2).strip()
        modules[f"mod{module_num}"] = content
        
    return modules