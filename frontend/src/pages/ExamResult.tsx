import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowRight, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { attemptsApi, type AttemptSummary } from '../api/attempts';

const ExamResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { examId: routeExamId } = useParams<{ examId: string }>();
  const queryAttemptId = searchParams.get('attemptId');
  const navigate = useNavigate();
  
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let targetAttemptId = queryAttemptId;
        
        // If attemptId is not in search params, attempt to resolve via history
        if (!targetAttemptId) {
          const history = await attemptsApi.getHistory();
          if (routeExamId) {
            const match = history.find(h => h.exam_id === routeExamId);
            if (match) targetAttemptId = match.attempt_id;
          } else if (history.length > 0) {
            targetAttemptId = history[0].attempt_id;
          }
        }

        if (!targetAttemptId) {
          setError('Could not locate exam attempt details.');
          return;
        }

        const data = await attemptsApi.getSummary(targetAttemptId);
        setSummary(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [queryAttemptId, routeExamId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Retrieving assessment summary...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Unable to Load Results</h2>
        <p className="text-slate-500">{error || "Could not find exam summary"}</p>
        <button onClick={() => navigate('/student/dashboard')} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm mt-4 shadow-sm hover:bg-indigo-700 transition-colors">
          Return to Student Dashboard
        </button>
      </div>
    );
  }

  const effectiveExamId = routeExamId || summary.exam_id;
  const scoreDisplay = summary.score !== undefined && summary.score !== null ? summary.score : null;
  const percentageDisplay = summary.percentage !== undefined && summary.percentage !== null ? summary.percentage.toFixed(1) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Banner header */}
        <div className="p-8 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-center space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-transparent" />
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md shadow-inner">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black">Examination Submitted!</h2>
          <p className="text-emerald-100/90 text-sm max-w-sm mx-auto">
            Your responses and proctoring logs have been recorded and saved.
          </p>
        </div>

        {/* Results Metrics */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Questions Answered</div>
              <div className="text-3xl font-extrabold text-slate-800 mt-2">
                {summary.answered_questions} <span className="text-slate-400 font-normal text-xl">/ {summary.total_questions}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 font-medium">Completion status recorded</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score / Evaluation</div>
              {scoreDisplay !== null ? (
                <div>
                  <div className="text-3xl font-black text-indigo-600 mt-2">{scoreDisplay}</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-0.5">{percentageDisplay}% Calculated</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block mt-3">
                    Submitted
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium">Awaiting evaluation</div>
                </div>
              )}
            </div>
          </div>

          {/* Action links */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button 
              onClick={() => {
                if (effectiveExamId) {
                  navigate(`/student/report?examId=${effectiveExamId}`);
                } else {
                  navigate('/student/history');
                }
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
