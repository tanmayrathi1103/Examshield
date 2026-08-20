import React, { useEffect, useState } from 'react';
import { useExams } from '../hooks/useExams';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Award, Play, CheckCircle, Calendar, AlertCircle } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { exams, fetchStudentExams, isLoading, error } = useExams();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetches only ACTIVE / SCHEDULED exams via /student/exams endpoint (backend filtered)
    fetchStudentExams();
  }, [fetchStudentExams]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };



  const getStatusConfig = (exam: typeof exams[0]) => {
    const now = new Date();
    if (exam.end_time && new Date(exam.end_time) < now) {
      return { label: 'Expired', color: 'bg-rose-100 text-rose-700', canStart: false };
    }
    if (exam.start_time && new Date(exam.start_time) > now) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700', canStart: false };
    }
    if (exam.status === 'active' || exam.status === 'scheduled') {
      return { label: 'Available', color: 'bg-emerald-100 text-emerald-700', canStart: true };
    }
    return { label: exam.status, color: 'bg-slate-100 text-slate-600', canStart: false };
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Student Portal</h1>
        <p className="text-slate-500 mt-1">Your assigned examinations appear below.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-1">No Exams Assigned</h3>
          <p className="text-sm text-slate-400">You have no published exams assigned to you at this time.</p>
          <p className="text-xs text-slate-400 mt-2">Contact your faculty member if you believe this is incorrect.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.map(exam => {
            const statusCfg = getStatusConfig(exam);
            return (
              <div
                key={exam.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden flex flex-col"
              >
                {/* Top color stripe based on status */}
                <div className={`h-1.5 w-full ${statusCfg.canStart ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                <div className="p-6 flex flex-col flex-1 space-y-4">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-800 leading-tight text-base">{exam.title}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{exam.exam_code} • {exam.subject}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Duration</div>
                        <div className="text-xs font-bold text-slate-700">{exam.duration_minutes} min</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Marks</div>
                        <div className="text-xs font-bold text-slate-700">{exam.total_marks}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="font-medium">{formatDate(exam.start_time)}</span>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto pt-2">
                    {exam.student_attempt_status && ['submitted', 'auto_submitted', 'evaluated'].includes(exam.student_attempt_status) ? (
                      <button
                        onClick={() => exam.student_attempt_id ? navigate(`/student/exam/${exam.id}/result?attemptId=${exam.student_attempt_id}`) : undefined}
                        className="w-full py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Completed (View Result)
                      </button>
                    ) : statusCfg.canStart ? (
                      <button
                        onClick={() => navigate(`/student/exam/${exam.id}/instructions`)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 hover:-translate-y-0.5"
                      >
                        <Play className="w-4 h-4" /> {exam.student_attempt_status && ['in_progress', 'paused'].includes(exam.student_attempt_status) ? 'Resume Exam' : 'Start Exam'}
                      </button>
                    ) : exam.start_time && new Date(exam.start_time) > new Date() ? (
                      <button
                        disabled
                        className="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Calendar className="w-4 h-4" /> Opens {formatDate(exam.start_time)}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 bg-rose-50 text-rose-400 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <AlertCircle className="w-4 h-4" /> Exam Expired
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
