import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Award, ShieldCheck, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';

const ExamResult: React.FC = () => {
  const { exams, questions, studentAnswers, resetExamState, violations } = useApp();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  const navigate = useNavigate();

  const exam = exams.find(e => e.id === examId) || exams[2]; // Fallback to database systems

  // Calculate score (simulate grading answers)
  let score = 0;
  questions.forEach(q => {
    if (studentAnswers[q.id] === q.correctOption) {
      score += q.points;
    }
  });

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  // Warnings flagged in this exam session
  const examViolationsCount = violations.filter(v => v.examTitle === exam.title).length;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Banner header */}
        <div className="p-8 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-center space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent" />
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black">Examination Submitted!</h2>
          <p className="text-emerald-100/90 text-sm max-w-sm mx-auto">
            Your exam answers and proctoring signatures have been uploaded successfully.
          </p>
        </div>

        {/* Results Metrics */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border p-5 rounded-2xl text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Assessment Score</div>
              <div className="text-3xl font-extrabold text-slate-800 mt-2">{score} / {totalPoints}</div>
              <div className="text-[10px] text-slate-500 mt-1">Passing requirement: &gt; 50%</div>
            </div>

            <div className="bg-slate-50 border p-5 rounded-2xl text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">AI Integrity Review</div>
              <div className={`text-sm font-extrabold px-2.5 py-1 rounded-lg border inline-block mt-3 ${
                examViolationsCount > 2 
                  ? 'text-rose-600 bg-rose-50 border-rose-100' 
                  : 'text-emerald-600 bg-emerald-50 border-emerald-100'
              }`}>
                {examViolationsCount > 2 ? 'Under Review' : 'Certified Safe'}
              </div>
              <div className="text-[10px] text-slate-500 mt-2">{examViolationsCount} flagged events</div>
            </div>
          </div>

          {examViolationsCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-xs text-amber-800 font-medium">
                We logged {examViolationsCount} minor alerts during your session. You can review exact timestamps and camera highlights in your compliance scorecard.
              </div>
            </div>
          )}

          {/* Action links */}
          <div className="space-y-3 pt-4 border-t">
            <button 
              onClick={() => {
                navigate(`/student/report?examId=${examId}`);
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition-all hover:-translate-y-0.5"
            >
              View Compliance & Behavior Report <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => {
                resetExamState();
                navigate('/student/dashboard');
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
