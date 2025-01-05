import unittest
from unittest.mock import Mock, patch
from ..core.embeddings import EmbeddingManager

class TestEmbeddingManager(unittest.TestCase):
    def setUp(self):
        """Set up test cases"""
        self.embedding_manager = EmbeddingManager()
    
    @patch('langchain_openai.OpenAIEmbeddings.embed_documents')
    def test_create_vectorstore(self, mock_embed):
        """Test vector store creation"""
        # Mock the embedding process
        mock_embed.return_value = [[0.1, 0.2, 0.3]]  # Mock embeddings
        
        documents = [Mock(page_content="Test content")]
        vectorstore = self.embedding_manager.create_vectorstore(documents)
        
        self.assertTrue(hasattr(vectorstore, 'similarity_search'))
    
    @patch('langchain_openai.OpenAIEmbeddings.embed_documents')
    def test_similarity_search(self, mock_embed):
        """Test similarity search functionality"""
        # Mock embeddings
        mock_embed.return_value = [[0.1, 0.2, 0.3]]
        
        documents = [
            Mock(page_content="First test content"),
            Mock(page_content="Second test content")
        ]
        
        vectorstore = self.embedding_manager.create_vectorstore(documents)
        results = vectorstore.similarity_search("test query", k=1)
        
        self.assertEqual(len(results), 1)

def run_tests():
    """Run all tests"""
    unittest.main()

if __name__ == '__main__':
    run_tests()