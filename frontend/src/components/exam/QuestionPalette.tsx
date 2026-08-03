import React from 'react';
import { StudentAnswer } from '../../api/attempts';

interface QuestionPaletteProps {
  totalQuestions: number;
  activeIndex: number;
  answers: StudentAnswer[];
  onJumpTo: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  activeIndex,
  answers,
  onJumpTo
}) => {
  // Helpers to determine color state
  const getQuestionState = (index: number) => {
    const answer = answers[index];
    if (!answer) return 'unvisited';
    if (answer.is_marked_for_review) return 'review';
    if (answer.is_answered) return 'answered';
    return 'not_answered';
  };

  const getStateClasses = (state: string, isActive: boolean) => {
    let classes = 'w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all border-2 ';
    
    if (isActive) {
      classes += 'ring-2 ring-offset-2 ring-indigo-500 ';
    }

    switch (state) {
      case 'answered':
        return classes + 'bg-green-100 text-green-700 border-green-500 shadow-sm';
      case 'review':
        return classes + 'bg-amber-100 text-amber-700 border-amber-500 shadow-sm';
      case 'not_answered':
        return classes + 'bg-red-50 text-red-600 border-red-300';
      default: // unvisited / neutral
        return classes + 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50';
    }
  };

  const stats = {
    answered: answers.filter(a => a.is_answered && !a.is_marked_for_review).length,
    notAnswered: answers.filter(a => !a.is_answered && !a.is_marked_for_review).length, // assuming generated eagerly, else need total - answered
    review: answers.filter(a => a.is_marked_for_review).length,
  };
  
  // Recalculate not answered to include unvisited
  stats.notAnswered = totalQuestions - stats.answered - stats.review;

  return (
    <div className="w-full md:w-72 bg-white border-l border-gray-200 flex flex-col hidden md:flex shrink-0">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Question Palette</h3>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const state = getQuestionState(idx);
            const isActive = activeIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => onJumpTo(idx)}
                className={getStateClasses(state, isActive)}
                aria-label={`Go to question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm">
        <div className="grid grid-cols-2 gap-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-500"></div>
            <span className="text-gray-600">Answered ({stats.answered})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-50 border border-red-300"></div>
            <span className="text-gray-600">Not Answered ({stats.notAnswered})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-amber-100 border border-amber-500"></div>
            <span className="text-gray-600">Review ({stats.review})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
