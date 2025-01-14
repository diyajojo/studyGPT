import PyPDF2
import re
# Step 1: Extract Text from PDF
def extract_text_from_pdf(file_path):
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text

# Step 2: Extract Content Between Syllabus and Textbooks
def extract_syllabus_content(text):
    # Define patterns for Syllabus and Textbook headings
    syllabus_pattern = r"Syllabus"
    textbook_pattern = r"Text Books|References|Reference Books"

    # Locate Syllabus and Textbook sections
    syllabus_match = re.search(syllabus_pattern, text, re.IGNORECASE)
    textbook_match = re.search(textbook_pattern, text, re.IGNORECASE)

    if not syllabus_match:
        print("Syllabus heading not found.")
        return None
    syllabus_start = syllabus_match.end()

    if textbook_match:
        syllabus_end = textbook_match.start()
    else:
        syllabus_end = len(text)

    # Extract syllabus content
    syllabus_content = text[syllabus_start:syllabus_end].strip()

    # Return the raw syllabus content between Syllabus and Textbooks headings
    return syllabus_content

# Step 3: Analyze the Extracted Content
def analyze_syllabus_content(content):
    print("Extracted Syllabus Content:\n")
    print(content)

# Main Execution
file_path = "Chemistry syllabus.pdf"  # Path to your PDF file
text = extract_text_from_pdf(file_path)

# Extract and analyze the content under Syllabus heading
syllabus_content = extract_syllabus_content(text)
if syllabus_content:
    analyze_syllabus_content(syllabus_content)
else:
    print("No content found under the Syllabus heading.")
