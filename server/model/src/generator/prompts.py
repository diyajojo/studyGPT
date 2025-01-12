TOPIC_PROMPT = """
Based on this content and additional context, identify the most important topics for {module_key}.
List only the topic names, no descriptions. Be specific and concise.

Content:
{content}

Additional Context:
{context}

Return only a JSON array of topic names.
"""

QA_PROMPT = """
Create {num_pairs} important question-answer pairs based on this content and context.
Questions should be specific and answers should be concise but complete.

Content:
{content}

Additional Context:
{context}

Return as a JSON array of {num_pairs} objects with 'question' and 'answer' keys.
"""

FLASHCARD_PROMPT = """
Create {num_cards} flashcard-style question-answer pairs from these notes and context.
Focus on key concepts and definitions. Keep both questions and answers concise.

Notes:
{content}

Additional Context:
{context}

Return as a JSON array of objects with 'question' and 'answer' keys.
"""