from langchain.prompts import PromptTemplate

class QAPrompts:
    SYLLABUS_PROMPT = PromptTemplate(
        input_variables=["topic"],
        template="""Generate 2 conceptual questions for the following topic from a syllabus. 
        Make sure the questions test understanding rather than just recall.
        Format: Return a Python list of dictionaries with 'question' and 'answer' keys.
        Topic: {topic}"""
    )
    
    CONTENT_PROMPT = PromptTemplate(
        input_variables=["content"],
        template="""Generate 2 meaningful questions and their detailed answers from the following content.
        Focus on testing comprehension and application of concepts.
        Ensure questions are specific to the content provided.
        Format: Return a Python list of dictionaries with 'question' and 'answer' keys.
        Content: {content}"""
    )
