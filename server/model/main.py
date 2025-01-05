from .core.qa_generator import QAGenerator
from .utils.formatters import format_qa_pairs

def generate_questions(pdf_path):
    #create qa generator instance
    qa_gen = QAGenerator()
    #generate qa pairs from pdf
    qa_pairs = qa_gen.generate_qa_pairs(pdf_path)
    #format the results
    return format_qa_pairs(qa_pairs)

if __name__ == "__main__":
    result = generate_questions("path/to/your/pdf")
    print(result)