def format_qa_pairs(qa_pairs):
    formatted = []
    for i, qa in enumerate(qa_pairs, 1):
        formatted.append(f"Q{i}. {qa['question']}\n")
        formatted.append(f"A{i}. {qa['answer']}\n\n")
    return "".join(formatted)