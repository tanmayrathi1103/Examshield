import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, FileText, CheckCircle2, XCircle, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { attemptsApi } from '../api/attempts';
import type { StudentExamHistoryItem } from '../types';

const ExamHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<StudentExamHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await attemptsApi.getHistory();
        setHistory(data);
      } catch (err: any) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : err.message || 'Failed to load exam history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Exam History</h1>
        <p className="text-slate-500">View and audit all your past assessments, scores, and AI integrity compliance records.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Assessment History</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total attempts recorded: {history.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-sm font-medium text-slate-400">Loading your exam records...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-700">No Assessment History Found</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                You haven't completed any examinations yet. When you take an exam, your scores and proctoring telemetry will appear here.
              </p>
            </div>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-200"
            >
              Go to Assigned Exams <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item) => {
              const isPass = item.result === 'PASS';
              const isUnderReview = item.result === 'UNDER_REVIEW' || item.result === 'PENDING';
              
              let resultBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
              let ResultIcon = XCircle;
              if (isPass) {
                resultBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                ResultIcon = CheckCircle2;
              } else if (isUnderReview) {
                resultBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                ResultIcon = AlertCircle;
              }

              let integrityColor = 'text-rose-600';
              let integrityBg = 'bg-rose-500';
              if (item.integrity_score >= 90) {
                integrityColor = 'text-emerald-600';
                integrityBg = 'bg-emerald-500';
              } else if (item.integrity_score >= 70) {
                integrityColor = 'text-amber-600';
                integrityBg = 'bg-amber-500';
              }

              return (
                <div 
                  key={item.attempt_id} 
                  className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.exam_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{item.subject}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight truncate">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-medium pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {formatDate(item.submitted_at || item.started_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 
                        {item.duration_minutes} Mins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
                    <div className="text-left lg:text-right min-w-[80px]">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</div>
                      <div className="text-base font-extrabold text-slate-800 mt-0.5">
                        {item.score !== null && item.score !== undefined ? (
                          <>
                            {item.score} <span className="text-xs text-slate-400 font-normal">/ {item.total_marks}</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal">Pending</span>
                        )}
                      </div>
                      {item.percentage !== null && item.percentage !== undefined && (
                        <div className="text-[10px] text-slate-400 font-semibold">{item.percentage.toFixed(1)}%</div>
                      )}
                    </div>

                    <div className="text-left lg:text-right min-w-[90px]">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Result</div>
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 mt-0.5 rounded-full text-xs font-bold border ${resultBadgeClass}`}>
                        <ResultIcon className="w-3 h-3" />
                        {item.result}
                      </div>
                    </div>

                    <div className="text-left lg:text-right min-w-[110px] pl-4 border-l border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center lg:justify-end gap-1">
                        <ShieldCheck className="w-3 h-3" /> Integrity
                      </div>
                      <div className={`text-base font-black mt-0.5 ${integrityColor}`}>
                        {item.integrity_score}%
                      </div>
                      <div className="w-20 lg:ml-auto h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full ${integrityBg} transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(0, item.integrity_score))}%` }}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/student/report?examId=${item.exam_id}`)}
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-indigo-100/80 shadow-xs"
                    >
                      <FileText className="w-4 h-4" /> Compliance Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamHistory;
