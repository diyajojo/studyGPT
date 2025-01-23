import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw ,HelpCircle,BookOpen} from 'lucide-react';

interface Flashcard 
{
  id: string;
  question_text: string;
  answer_text: string;
  subject_id: string;
  module_no: number;
}

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: string;
  flashcards: Flashcard[];
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  onClose,
  module,
  flashcards
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  const EmptyCardState = () => (
    <div className="py-8 px-4 text-center">
      <div className="flex justify-center mb-4">
        <HelpCircle className="h-12 w-12 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        No FlashCards 🎯
      </h3>
      <p className="text-gray-600 mb-4">
        This module looks too simple for you 😔!
        </p>
        <p className="text-gray-600 mb-4">It might be your lucky day - less to memorize!</p>
      <div className="flex items-center justify-center gap-2 text-blue-600">
        <BookOpen className="h-5 w-5" />
        <span className="text-sm font-medium">Focus on understanding the concepts!</span>
      </div>
    </div>
  );

  const handlePrevCard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking navigation
    setCurrentCardIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
    setIsFlipped(false);
  };

  const handleNextCard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking navigation
    setCurrentCardIndex((prev) => (prev === flashcards.length - 1 ? 0 : prev + 1));
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Handle clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-noto text-xl font-semibold text-gray-800">
            Flashcards - {module}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {flashcards.length > 0 ? (
          <div className="space-y-6">
            {/* Card Container */}
            <div className="relative w-full h-96">
              <div
                className="w-full h-full transition-all duration-500 cursor-pointer [transform-style:preserve-3d]"
                style={{
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
                onClick={handleFlip}
              >
                {/* Front of Card (Question) */}
                <div 
                  className="absolute inset-0 bg-white border-2 border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden]"
                >
                  <h3 className="font-roboto text-lg font-bold text-gray-600  mb-4">Question:</h3>
                  <p className="font-noto text-xl text-center text-gray-800">
                    {flashcards[currentCardIndex].question_text}
                  </p>
                  <div className="absolute bottom-4 text-sm text-blue-600 flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Click to see answer
                  </div>
                </div>

                {/* Back of Card (Answer) */}
                <div 
                  className="absolute inset-0 bg-white border-2 border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
                >
                  <h3 className="font-roboto text-lg font-bold  text-gray-600 mb-4">Answer:</h3>
                  <p className="font-noto text-xl text-center text-gray-800">
                    {flashcards[currentCardIndex].answer_text}
                  </p>
                  <div className="absolute bottom-4 text-sm text-blue-600 flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Click to see question
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between px-4">
              <button
                onClick={handlePrevCard}
                className="p-3 rounded-full hover:bg-gray-100 text-gray-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </p>
              </div>

              <button
                onClick={handleNextCard}
                className="p-3 rounded-full hover:bg-gray-100 text-gray-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <EmptyCardState/>
        )}
      </div>
    </div>
  );
};

export default FlashcardModal;