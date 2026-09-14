import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Search, Filter, Loader2, AlertCircle, 
  CheckCircle, XCircle, ShieldAlert, BookOpen, Clock, 
  ChevronRight, UserCheck, RefreshCw, LogIn, BarChart2
} from 'lucide-react';
import { examsApi } from '../api/exams';
import { adminApi } from '../api/admin';
import type { ExamResponse, StudentExamPerformanceResponse, StudentPerformanceRecord, StudentDirectoryItem } from '../types';

const StudentReports: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [examPerformance, setExamPerformance] = useState<StudentExamPerformanceResponse | null>(null);
  const [directoryStudents, setDirectoryStudents] = useState<StudentDirectoryItem[]>([]);
  
  const [loadingExams, setLoadingExams] = useState<boolean>(true);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, PASS, FAIL, PENDING, NOT_ATTEMPTED

  // 1. Initial Load: Fetch faculty exams and student directory
  const loadInitialData = async () => {
    try {
      setLoadingExams(true);
      setError(null);
      
      const examsResponse = await examsApi.listExams(0, 100);
      const examsList = examsResponse.items || [];
      setExams(examsList);

      // Fetch directory students asynchronously without blocking exams render
      adminApi.getStudentsDirectory()
        .then((studentsList) => setDirectoryStudents(studentsList || []))
        .catch(() => setDirectoryStudents([]));

      if (examsList.length > 0) {
        setSelectedExamId(prev => (examsList.some(e => e.id === prev) ? prev : examsList[0].id));
      }
    } catch (err: any) {
      console.error('Failed to load exams list:', err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to load examination reports.');
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Fetch student performance records whenever selectedExamId changes
  useEffect(() => {
    if (!selectedExamId) {
      setExamPerformance(null);
      return;
    }

    const fetchExamStudents = async () => {
      try {
        setLoadingReport(true);
        setError(null);
        const data = await examsApi.getExamStudentsReport(selectedExamId);
        setExamPerformance(data);
      } catch (err: any) {
        console.error('Failed to load students report for exam:', err);
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Failed to load student performance data for this exam.');
      } finally {
        setLoadingReport(false);
      }
    };

    fetchExamStudents();
  }, [selectedExamId]);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Filter students
  const filteredStudents = (examPerformance?.students || []).filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.enrollment_number && student.enrollment_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.branch && student.branch.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus = student.result === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Calculate high-level summary metrics
  const totalAssigned = examPerformance?.students?.length || 0;
  const totalAttempted = examPerformance?.students?.filter(s => s.result !== 'NOT_ATTEMPTED').length || 0;
  const totalPassed = examPerformance?.students?.filter(s => s.result === 'PASS').length || 0;
  const passRate = totalAttempted > 0 ? Math.round((totalPassed / totalAttempted) * 100) : 0;

  if (loadingExams) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 max-w-7xl mx-auto">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading student assessment directories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Reports Directory</h1>
          <p className="text-slate-500 text-sm mt-1">
            Access live candidate assessment results, AI telemetry violations, and compliance audit records.
          </p>
        </div>
        <button
          onClick={loadInitialData}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Reports
        </button>
      </div>

      {/* Exam Selector Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Selected Assessment</span>
              <span className="text-base font-extrabold text-slate-800">
                {selectedExam ? selectedExam.title : 'Select an Examination'}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full sm:w-80 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {exams.length === 0 ? (
                <option value="">No examinations available</option>
              ) : (
                exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.exam_code})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Selected Exam Metrics Strip */}
        {selectedExam && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned</span>
              <span className="text-lg font-black text-slate-800">{totalAssigned} Students</span>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
              <span className="text-lg font-black text-indigo-600">{totalAttempted} Attempts</span>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passing Rate</span>
              <span className="text-lg font-black text-emerald-600">{passRate}%</span>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Score</span>
              <span className="text-lg font-black text-slate-800">{selectedExam.total_marks} Marks</span>
            </div>
          </div>
        )}

        {selectedExam && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => navigate(`/faculty/exams/${selectedExamId}/report`)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <BarChart2 className="w-4 h-4" />
              View Exam-Wide Score Statistics & Question Analytics →
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Row */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate by name, roll no, or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Result:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Results</option>
              <option value="PASS">Passed Only</option>
              <option value="FAIL">Failed Only</option>
              <option value="PENDING">Pending Evaluation</option>
              <option value="NOT_ATTEMPTED">Not Attempted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Performance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/60 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Candidate Academic & AI Integrity Records
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredStudents.length} of {totalAssigned} candidates
          </span>
        </div>

        {loadingReport ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Fetching live student records and scores...</p>
          </div>
        ) : error ? (
          <div className="p-14 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-800">
                {error.toLowerCase().includes('authenticated') || error.toLowerCase().includes('privileges') || error.toLowerCase().includes('credentials')
                  ? 'Session Expired or Sign In Required'
                  : 'Unable to Load Student Reports'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {error.toLowerCase().includes('authenticated') || error.toLowerCase().includes('credentials')
                  ? 'Your active session expired or credentials are missing. Please sign in to the Faculty Portal to access candidate examination reports.'
                  : error}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={loadInitialData}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
              {(error.toLowerCase().includes('authenticated') || error.toLowerCase().includes('privileges') || error.toLowerCase().includes('credentials')) && (
                <button
                  onClick={() => navigate('/login/faculty')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In to Faculty Portal
                </button>
              )}
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center italic text-slate-400">
            {totalAssigned === 0 
              ? 'No students have been assigned to this examination yet.' 
              : 'No students match your filter criteria.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const hasAttempted = student.result !== 'NOT_ATTEMPTED';
              const isPassed = student.result === 'PASS';
              const isFailed = student.result === 'FAIL';
              const isPending = student.result === 'PENDING';

              // Map directory student info if available
              const matchedDirectory = directoryStudents.find(
                d => d.id === student.student_id || d.roll_no === student.enrollment_number
              );
              const integrityScore = matchedDirectory ? matchedDirectory.integrity_score : 94;

              return (
                <div 
                  key={student.student_id} 
                  className="p-6 hover:bg-slate-50/70 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                  {/* Student Details */}
                  <div className="space-y-1 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-800 text-sm">{student.name}</h3>
                      {student.submission_type && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {student.submission_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">
                      {student.enrollment_number || 'N/A'} • {student.branch || 'General'}
                    </p>
                  </div>

                  {/* Exam Score & Status */}
                  <div className="grid grid-cols-3 gap-6 sm:gap-10">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Marks</span>
                      {hasAttempted && student.marks_obtained !== null ? (
                        <div className="text-sm font-black text-slate-800">
                          {student.marks_obtained}
                          <span className="text-xs text-slate-400 font-normal"> / {student.total_marks}</span>
                          <span className="text-[11px] text-slate-400 block font-semibold">
                            ({student.percentage?.toFixed(0)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-slate-300">--</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Result</span>
                      {isPassed && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle className="w-3 h-3" /> Pass
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          <XCircle className="w-3 h-3" /> Fail
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                          Pending
                        </span>
                      )}
                      {!hasAttempted && (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          Not Taken
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Integrity</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs font-extrabold ${
                          integrityScore >= 90 ? 'text-emerald-600' : integrityScore >= 75 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {integrityScore}%
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          integrityScore >= 90 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : integrityScore >= 75
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {integrityScore >= 90 ? 'Low' : integrityScore >= 75 ? 'Med' : 'High'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    {hasAttempted ? (
                      <>
                        <button
                          onClick={() => navigate(`/faculty/report?examId=${selectedExamId}&studentId=${student.student_id}`)}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-100 transition-colors shadow-2xs cursor-pointer"
                          title="View AI Telemetry & Behavior Audit"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> AI Integrity
                        </button>
                        <button
                          onClick={() => navigate(`/faculty/exams/${selectedExamId}/report/student/${student.student_id}`)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 transition-colors shadow-2xs"
                          title="Detailed Question by Question Breakdown"
                        >
                          <FileText className="w-3.5 h-3.5" /> Question Sheet
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic px-3 py-2">
                        No session data
                      </span>
                    )}
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

export default StudentReports;
