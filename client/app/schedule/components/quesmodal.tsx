import React, { useState } from 'react';
import { X, ChevronRight, HelpCircle, BookOpen } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  answer_text: string;
  subject_id: string;
  module_no: number;
}

interface QuestionAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: string;
  questions: Question[];
}

const QuestionAnswerModal: React.FC<QuestionAnswerModalProps> = ({
  isOpen,
  onClose,
  module,
  questions
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  if (!isOpen) return null;

  const EmptyQuestionState = () => (
    <div className="py-8 px-4 text-center">
      <div className="flex justify-center mb-4">
        <HelpCircle className="h-12 w-12 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        No Questions Yet! 🎯
      </h3>
      <p className="text-gray-600 mb-4">
        This module hasn't appeared in previous year papers recently.
        It might be your lucky day - less to memorize!
      </p>
      <div className="flex items-center justify-center gap-2 text-blue-600">
        <BookOpen className="h-5 w-5" />
        <span className="text-sm font-medium">Focus on understanding the concepts!</span>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-blue-50 to-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-noto text-2xl font-semibold text-gray-800">
              Previous Year Questions - {module}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="flex gap-6 h-[600px]">
            {/* Questions List */}
            <div className="w-1/2 space-y-3 overflow-y-auto pr-4">
              {questions.length > 0 ? (
                questions.map((question) => (
                  <button
                    key={question.id}
                    className={`w-full p-4 text-left rounded-lg transition-all transform hover:scale-102 hover:shadow-md flex justify-between items-center ${
                      selectedQuestion?.id === question.id
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'bg-white border border-gray-200 hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-noto text-gray-800 font-medium line-clamp-2">
                        {question.question_text}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))
              ) : (
                <EmptyQuestionState />
              )}
            </div>

            {/* Answer Panel */}
            {selectedQuestion ? (
              <div className="w-1/2 bg-white rounded-lg p-6 overflow-y-auto border border-gray-200">
                <div className="space-y-4">
                  <div className="pb-4 border-b border-gray-200">
                    <h3 className="font-roboto text-lg font-semibold text-gray-800 mb-2">Question</h3>
                    <p className="font-noto text-gray-700">{selectedQuestion.question_text}</p>
                  </div>
                  <div>
                    <h3 className="font-roboto text-lg font-semibold text-gray-800 mb-2">Answer</h3>
                    <p className="font-noto text-gray-700 whitespace-pre-wrap">{selectedQuestion.answer_text}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-1/2 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Select a question to view its answer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAnswerModal;