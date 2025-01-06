import unittest
from unittest.mock import Mock, patch
from ..core.qa_generator import QAGenerator

class TestQAGenerator(unittest.TestCase):
    def setUp(self):
        """Set up test cases"""
        self.qa_generator = QAGenerator()
        
    def test_is_syllabus(self):
        """Test syllabus detection"""
        # Test positive case
        syllabus_text = """
        Course Outline
        1. Introduction to Python
        2. Data Structures
        Prerequisites: Basic Programming
        Learning Outcomes: Understanding of core concepts
        """
        self.assertTrue(self.qa_generator.is_syllabus(syllabus_text))
        
        # Test negative case
        content_text = """
        Python is a programming language. It was created by Guido van Rossum.
        Python is known for its simplicity and readability.
        """
        self.assertFalse(self.qa_generator.is_syllabus(content_text))
    
    def test_extract_topics(self):
        """Test topic extraction from syllabus"""
        syllabus_text = """
        1. Introduction to Python
        2. Data Structures
        - Functions and Methods
        * Object-Oriented Programming
        """
        topics = self.qa_generator.extract_topics(syllabus_text)
        expected_topics = [
            "Introduction to Python",
            "Data Structures",
            "Functions and Methods",
            "Object-Oriented Programming"
        ]
        self.assertEqual(topics, expected_topics)
    
    @patch('langchain.chains.LLMChain.run')
    def test_generate_syllabus_questions(self, mock_run):
        """Test question generation for syllabus"""
        mock_run.return_value = """[
            {"question": "What are the core features of Python?", 
             "answer": "Python's core features include..."}
        ]"""
        
        syllabus_text = "1. Introduction to Python"
        questions = self.qa_generator.generate_syllabus_questions(syllabus_text)
        
        self.assertTrue(len(questions) > 0)
        self.assertIn('question', questions[0])
        self.assertIn('answer', questions[0])
    
    def test_filter_duplicate_questions(self):
        """Test duplicate question filtering"""
        qa_pairs = [
            {"question": "What is Python?", "answer": "A programming language"},
            {"question": "What exactly is Python?", "answer": "A programming language"},
            {"question": "How does a loop work?", "answer": "Loops iterate over sequences"}
        ]
        
        filtered = self.qa_generator.filter_duplicate_questions(qa_pairs, 0.85)
        self.assertTrue(len(filtered) < len(qa_pairs))