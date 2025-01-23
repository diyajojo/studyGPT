import React from 'react';
import { X, Sparkles, BookOpen, BookMarked } from 'lucide-react';

interface Topic {
  id: string;
  topic_name: string;
  subject_id: string;
  module_number: number;
}

interface ModuleTopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: string;
  topics: Topic[];
}

const ModuleTopicsModal: React.FC<ModuleTopicsModalProps> = ({
  isOpen,
  onClose,
  module,
  topics,
}) => {
  if (!isOpen) return null;

  const EmptyStateComponent = () => (
    <div className="py-8 px-4 text-center">
      <div className="flex justify-center mb-4">
        <Sparkles className="h-12 w-12 text-purple-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        You're in for a treat! 🎉
      </h3>
      <p className="text-gray-600 mb-4">
        This module is special - it's so straightforward that it doesn't need any important topics highlighted.
        You're already a step ahead!
      </p>
      <div className="flex items-center justify-center gap-2 text-purple-600">
        <BookOpen className="h-5 w-5" />
        <span className="text-sm font-medium">Ready to explore the basics!</span>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-purple-50 to-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-noto text-2xl font-semibold text-gray-800">
              Important Topics - {module}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.length > 0 ? (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:scale-102 border border-purple-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookMarked className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-noto text-lg font-medium text-gray-800">
                        {topic.topic_name}
                      </h3>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2">
                <EmptyStateComponent />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleTopicsModal;