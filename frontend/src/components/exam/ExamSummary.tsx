import React from 'react';
import { AttemptSummary } from '../../api/attempts';
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExamSummaryProps {
  summary: AttemptSummary;
  examTitle: string;
}

export const ExamSummary: React.FC<ExamSummaryProps> = ({ summary, examTitle }) => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100 my-12 text-center">
      
      <div className="flex justify-center mb-6">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Examination Submitted Successfully</h1>
      <p className="text-gray-500 mb-8">{examTitle}</p>

      <div className="grid grid-cols-2 gap-4 mb-8 text-left">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          <p className="font-semibold text-gray-900 capitalize">{summary.status.replace('_', ' ')}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Time Submitted</p>
          <p className="font-semibold text-gray-900">
            {summary.submitted_at ? new Date(summary.submitted_at).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <p className="text-sm text-indigo-600 mb-1">Total Questions</p>
          <p className="font-bold text-2xl text-indigo-900">{summary.total_questions}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-sm text-green-600 mb-1">Questions Answered</p>
          <p className="font-bold text-2xl text-green-900">{summary.answered_questions}</p>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start text-left mb-8 text-sm">
        <AlertTriangle className="h-5 w-5 mr-3 shrink-0 mt-0.5" />
        <p>Your responses have been securely saved and locked. Your results will be published by the faculty after evaluation and audit.</p>
      </div>

      <button
        onClick={() => navigate('/student/dashboard')}
        className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
      >
        <span>Return to Dashboard</span>
        <ArrowRight className="h-4 w-4" />
      </button>

    </div>
  );
};
