import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface NavigationFooterProps {
  isFirst: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const NavigationFooter: React.FC<NavigationFooterProps> = ({
  isFirst,
  isLast,
  onPrevious,
  onNext,
  onSubmit
}) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4 md:px-8 flex items-center justify-between sticky bottom-0 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
          isFirst 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Previous</span>
      </button>

      {!isLast ? (
        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <span>Save & Next</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          className="flex items-center space-x-2 px-8 py-2.5 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md"
        >
          <span>Submit Exam</span>
          <CheckCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
