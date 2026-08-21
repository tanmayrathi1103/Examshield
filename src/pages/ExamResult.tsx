import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Award, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { attemptsApi, type AttemptSummary } from '../api/attempts';

const ExamResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();
  
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) {
      navigate('/student/dashboard');
      return;
    }

    const fetchSummary = async () => {
      try {
        const data = await attemptsApi.getSummary(attemptId);
        setSummary(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [attemptId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Error Loading Results</h2>
        <p className="text-slate-500">{error || "Could not find exam summary"}</p>
        <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg mt-4">Return to Dashboard</button>
      </div>
    );
  }

  const examViolationsCount = 0; // Mock for now

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
              <div className="text-xs font-bold text-slate-400 uppercase">Questions Answered</div>
              <div className="text-3xl font-extrabold text-slate-800 mt-2">{summary.answered_questions} / {summary.total_questions}</div>
              <div className="text-[10px] text-slate-500 mt-1">Total score will be available after grading</div>
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
                navigate(`/student/report?attemptId=${attemptId}`);
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition-all hover:-translate-y-0.5"
            >
              View Compliance & Behavior Report <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => {
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
