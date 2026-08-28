import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, User, Clock, CheckCircle, XCircle, AlertCircle, HelpCircle
} from 'lucide-react';
import { useExamReport } from '../hooks/useExamReport';

const StudentDetailReport: React.FC = () => {
  const { examId, studentId } = useParams<{ examId: string, studentId: string }>();
  const navigate = useNavigate();
  const { studentDetail, loading, error, fetchStudentDetail } = useExamReport(examId!);

  useEffect(() => {
    if (examId && studentId) {
      fetchStudentDetail(studentId);
    }
  }, [examId, studentId, fetchStudentDetail]);

  if (loading && !studentDetail) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error || !studentDetail) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h3 className="text-lg font-bold">Error Loading Student Report</h3>
          <p className="mt-2 text-sm">{error || "Failed to load student detail report data."}</p>
          <button 
            onClick={() => navigate(`/faculty/exams/${examId}/report`)}
            className="mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
          >
            Back to Exam Report
          </button>
        </div>
      </div>
    );
  }

  const { student, questions } = studentDetail;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate(`/faculty/exams/${examId}/report`)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Exam Report
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Detail Report</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Sidebar: Profile & Attempt Info */}
        <div className="space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
                <p className="text-sm text-slate-500">{student.enrollment_number || 'No Enrollment Number'}</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Branch</span>
                <span className="text-slate-900">{student.branch || '--'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Semester</span>
                <span className="text-slate-900">{student.semester || '--'}</span>
              </div>
            </div>
          </div>

          {/* Attempt Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-6">Attempt Information</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Status</span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  student.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' :
                  student.result === 'FAIL' ? 'bg-rose-100 text-rose-700' :
                  student.result === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {student.result}
                </span>
              </div>

              {student.marks_obtained !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Score</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-lg">{student.marks_obtained}</span>
                    <span className="text-slate-500"> / {student.total_marks}</span>
                    <div className="text-xs text-slate-400 mt-0.5">{student.percentage?.toFixed(1)}%</div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5"><Clock className="w-4 h-4"/> Time Taken</span>
                  <span className="text-slate-900">{student.time_taken_mins ? `${student.time_taken_mins.toFixed(1)} mins` : '--'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Submission Type</span>
                  <span className="text-slate-900">{student.submission_type?.replace('_', ' ') || '--'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Attempt ID</span>
                  <span className="text-slate-400 font-mono text-xs">{student.attempt_id ? `${student.attempt_id.substring(0,8)}...` : '--'}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Content: Question Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Question-by-Question Results</h2>
          
          {questions.length === 0 ? (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
               <p className="text-slate-500">No questions found for this exam.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.question_id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {q.question_number}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-500 mb-1">{q.question_type.replace('_', ' ')}</div>
                        <h4 className="text-base font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">{q.question_text}</h4>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold mb-2 ${
                        q.evaluation_status === 'Correct' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        q.evaluation_status === 'Incorrect' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        q.evaluation_status === 'Unanswered' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {q.evaluation_status === 'Correct' && <CheckCircle className="w-3.5 h-3.5" />}
                        {q.evaluation_status === 'Incorrect' && <XCircle className="w-3.5 h-3.5" />}
                        {q.evaluation_status === 'Pending Manual Evaluation' && <AlertCircle className="w-3.5 h-3.5" />}
                        {q.evaluation_status === 'Unanswered' && <HelpCircle className="w-3.5 h-3.5" />}
                        {q.evaluation_status}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {q.marks_obtained} <span className="text-slate-400 font-normal">/ {q.marks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-11 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Student Answer</span>
                      {q.student_answer ? (
                        <p className="text-sm text-slate-900 whitespace-pre-wrap">{q.student_answer}</p>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No answer provided.</p>
                      )}
                    </div>
                    
                    {q.correct_answer && (
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Correct Answer</span>
                        <p className="text-sm text-slate-900 whitespace-pre-wrap">{q.correct_answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailReport;
