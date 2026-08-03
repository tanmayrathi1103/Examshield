import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface InstructionCardProps {
  examTitle: string;
  durationMinutes: number;
  totalMarks: number;
  onAccept: () => void;
  isLoading: boolean;
}

export const InstructionCard: React.FC<InstructionCardProps> = ({
  examTitle,
  durationMinutes,
  totalMarks,
  onAccept,
  isLoading
}) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-gray-100 my-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{examTitle}</h1>
        <div className="flex items-center justify-center space-x-4 text-gray-600">
          <span>Duration: <span className="font-semibold text-gray-900">{durationMinutes} mins</span></span>
          <span>•</span>
          <span>Total Marks: <span className="font-semibold text-gray-900">{totalMarks}</span></span>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h3 className="flex items-center text-blue-900 font-bold mb-3">
            <AlertCircle className="h-5 w-5 mr-2" />
            General Instructions
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-blue-800 text-sm">
            <li>The timer will start immediately upon clicking "Start Examination".</li>
            <li>Do not refresh the page or use the back button during the exam.</li>
            <li>Ensure you have a stable internet connection. Answers are auto-saved.</li>
            <li>The exam will auto-submit when the time expires.</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <h3 className="flex items-center text-amber-900 font-bold mb-3">
            <ShieldAlert className="h-5 w-5 mr-2" />
            Exam Rules (Proctoring)
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-amber-800 text-sm">
            <li>You must remain in fullscreen mode throughout the exam.</li>
            <li>Navigating away from the exam tab will be recorded as a violation.</li>
            <li>Camera and microphone access will be continuously monitored (if enabled).</li>
            <li>Any unfair means will result in immediate termination of the exam.</li>
          </ul>
        </div>
      </div>

      <div className="flex items-start space-x-3 mb-8 p-4 border border-gray-200 rounded-xl bg-gray-50 cursor-pointer" onClick={() => setAgreed(!agreed)}>
        <input 
          type="checkbox" 
          checked={agreed}
          onChange={() => setAgreed(!agreed)}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
        />
        <p className="text-sm text-gray-700 select-none">
          I have read and understood all the instructions. I agree that I will not use any unfair means during the examination and I consent to my session being monitored.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onAccept}
          disabled={!agreed || isLoading}
          className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-lg transition-all ${
            agreed && !isLoading
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="animate-pulse">Starting...</span>
          ) : (
            <>
              <span>Start Examination</span>
              <CheckCircle2 className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
