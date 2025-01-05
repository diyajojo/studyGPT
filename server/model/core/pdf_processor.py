from langchain_community.document_loaders import PyPDFLoader
from ..utils.text_splitter import get_text_splitter

class PDFProcessor:
    def __init__(self):

        #initialize with a text splitter fron utils
        self.text_splitter = get_text_splitter()
    
    def load_pdf(self, pdf_path):
        #pdf loader object
        loader = PyPDFLoader(pdf_path)
        return loader.load()
    
    def process_pdf(self, pdf_path):

        #load pdf and spllit it into manageable chunks
        pages = self.load_pdf(pdf_path)
        return self.text_splitter.split_documents(pages)