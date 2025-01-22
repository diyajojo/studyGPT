import re
from typing import Dict

def extract_modules(text: str) -> Dict[str, str]:
    """Extract modules from text content, handling both Arabic and Roman numerals optionally."""
    # Define a regex pattern to capture module numbers (Arabic or Roman) and content
    module_pattern = r"Module\s*[-:]?\s*([\dIVXLCDM]+)\s*[-:]?\s*(.*?)(?=Module\s*[-:]?\s*[\dIVXLCDM]+|$)"
    modules = {}
    
    # Use re.finditer to find all matches
    matches = re.finditer(module_pattern, text, re.DOTALL | re.IGNORECASE)
    for match in matches:
        module_num = match.group(1)
        content = match.group(2).strip()
        modules[f"mod{module_num}"] = content  # Use mod<module number> as the key
        
    return modules
