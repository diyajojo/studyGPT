import unittest
from unittest.mock import Mock, patch
from ..core.pdf_processor import PDFProcessor

class TestPDFProcessor(unittest.TestCase):
    def setUp(self):
        """Set up test cases"""
        self.pdf_processor = PDFProcessor()
    
    @patch('langchain_community.document_loaders.PyPDFLoader.load')
    def test_load_pdf(self, mock_load):
        """Test PDF loading"""
        # Mock the PDF loading
        mock_load.return_value = [Mock(page_content="Test content")]
        
        result = self.pdf_processor.load_pdf("test.pdf")
        self.assertTrue(len(result) > 0)
        self.assertTrue(hasattr(result[0], 'page_content'))
    
    @patch('langchain_community.document_loaders.PyPDFLoader.load')
    def test_process_pdf(self, mock_load):
        """Test PDF processing"""
        # Mock the PDF content
        mock_load.return_value = [
            Mock(page_content="This is a test document. " * 100)  # Long content
        ]
        
        chunks = self.pdf_processor.process_pdf("test.pdf")
        
        # Verify chunking
        self.assertTrue(len(chunks) > 1)  # Should split into multiple chunks
        self.assertTrue(all(len(chunk.page_content) <= 1000 for chunk in chunks))