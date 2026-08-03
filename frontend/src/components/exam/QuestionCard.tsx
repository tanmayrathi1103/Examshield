import React from 'react';
import { Bookmark, HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  marks: number;
  negativeMarks?: number;
  isMarkedForReview: boolean;
  onToggleReview: () => void;
  children: React.ReactNode;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNumber,
  questionText,
  marks,
  negativeMarks,
  isMarkedForReview,
  onToggleReview,
  children
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white flex flex-col">
      <div className="max-w-4xl w-full mx-auto">
        
        {/* Header (Question Metadata) */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-md text-sm">
              Question {questionNumber}
            </span>
            <div className="flex space-x-2 text-xs font-medium">
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded">+{marks} Marks</span>
              {negativeMarks && negativeMarks > 0 && (
                <span className="text-red-600 bg-red-50 px-2 py-1 rounded">-{negativeMarks} Negative</span>
              )}
            </div>
          </div>
          
          <button 
            onClick={onToggleReview}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isMarkedForReview 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={isMarkedForReview ? 'currentColor' : 'none'} />
            <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
          </button>
        </div>

        {/* Question Content */}
        <div className="prose max-w-none mb-8 text-gray-800 text-lg">
          <p>{questionText}</p>
        </div>

        {/* Answer Area (Options / Textarea) */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-4 text-sm font-semibold text-gray-700">
            <HelpCircle className="h-4 w-4" />
            <span>Your Answer</span>
          </div>
          {children}
        </div>

      </div>
    </div>
  );
};
