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
    if (exam.status === 'active') {
      return { label: 'Active (Available)', color: 'bg-emerald-100 text-emerald-700', canStart: true };
    }
    if (exam.end_time && new Date(exam.end_time) < now) {
      return { label: 'Expired', color: 'bg-rose-100 text-rose-700', canStart: false };
    }
    if (exam.start_time && new Date(exam.start_time) > now) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700', canStart: false };
    }
    if (exam.status === 'scheduled' || exam.status === 'draft') {
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
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* Clean Top Status Strip */}
                <div className={`h-1.5 w-full rounded-t-2xl ${statusCfg.canStart ? 'bg-indigo-600' : 'bg-slate-300'}`} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Clean Typography */}
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{exam.title}</h3>
                  <p className="text-sm text-slate-500 font-medium mb-6">{exam.exam_code} • {exam.subject}</p>

                  {/* Minimal Info Row */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold">{exam.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Award className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold">{exam.total_marks} marks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{formatDate(exam.start_time)}</span>
                  </div>

                  {/* Classic Solid Button */}
                  <div className="mt-auto">
                    {exam.student_attempt_status && ['submitted', 'auto_submitted', 'evaluated'].includes(exam.student_attempt_status) ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => exam.student_attempt_id ? navigate(`/student/exam/${exam.id}/result?attemptId=${exam.student_attempt_id}`) : undefined}
                          className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border border-emerald-200"
                        >
                          <CheckCircle className="w-4 h-4" /> Result
                        </button>
                        <button
                          onClick={() => navigate(`/student/exam/${exam.id}/instructions`)}
                          className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <Play className="w-4 h-4" /> Retake
                        </button>
                      </div>
                    ) : statusCfg.canStart ? (
                      <button
                        onClick={() => navigate(`/student/exam/${exam.id}/instructions`)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <Play className="w-4 h-4" /> {exam.student_attempt_status && ['in_progress', 'paused'].includes(exam.student_attempt_status) ? 'Resume Exam' : 'Start Exam'}
                      </button>
                    ) : exam.start_time && new Date(exam.start_time) > new Date() ? (
                      <button
                        disabled
                        className="w-full py-3 bg-slate-50 text-slate-400 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed"
                      >
                        <Calendar className="w-4 h-4" /> Opens {formatDate(exam.start_time)}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 bg-rose-50 text-rose-400 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-rose-100 cursor-not-allowed"
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
