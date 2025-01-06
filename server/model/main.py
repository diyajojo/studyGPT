<<<<<<< HEAD
from server.model.core.qa_generator import QAGenerator
from server.model.utils.formatters import format_qa_pairs
=======
from .core.qa_generator import QAGenerator
from .utils.formatters import format_qa_pairs
>>>>>>> 65c765503655557d72571c2ad8e833d9412a8989

def generate_questions(pdf_path):
    #create qa generator instance
    qa_gen = QAGenerator()
    #generate qa pairs from pdf
    qa_pairs = qa_gen.generate_qa_pairs(pdf_path)
    #format the results
    return format_qa_pairs(qa_pairs)

if __name__ == "__main__":
<<<<<<< HEAD
    result = generate_questions("server/model/mod1.pdf")
=======
    result = generate_questions("path/to/your/pdf")
>>>>>>> 65c765503655557d72571c2ad8e833d9412a8989
    print(result)