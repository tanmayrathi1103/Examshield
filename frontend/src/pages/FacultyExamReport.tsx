import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, CheckCircle, XCircle, Clock, Search, Filter,
  BarChart2, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { useExamReport } from '../hooks/useExamReport';

const FacultyExamReport: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { 
    summary, studentsReport, questionAnalytics, 
    loading, error, fetchAllReports 
  } = useExamReport(examId!);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');

  useEffect(() => {
    if (examId) {
      fetchAllReports();
    }
  }, [examId, fetchAllReports]);

  if (loading && !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error || !summary || !studentsReport || !questionAnalytics) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h3 className="text-lg font-bold">Error Loading Report</h3>
          <p className="mt-2 text-sm">{error || "Failed to load exam report data."}</p>
          <button 
            onClick={() => navigate('/faculty/dashboard')}
            className="mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const filteredStudents = studentsReport.students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.enrollment_number && s.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'SUBMITTED') matchesStatus = s.attempt_status === 'SUBMITTED' || s.attempt_status === 'EVALUATED';
      else if (statusFilter === 'AUTO_SUBMITTED') matchesStatus = s.attempt_status === 'AUTO_SUBMITTED';
      else if (statusFilter === 'NOT_ATTEMPTED') matchesStatus = s.result === 'NOT_ATTEMPTED';
    }

    let matchesResult = true;
    if (resultFilter !== 'ALL') {
      matchesResult = s.result === resultFilter;
    }

    return matchesSearch && matchesStatus && matchesResult;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate(`/faculty/manage-exam/${examId}`)}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Manage Exam
          </button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{summary.title} - Report</h1>
          <p className="text-slate-500 mt-1">Detailed performance and analytics for this examination.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
            summary.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {summary.status}
          </span>
          <span className="text-sm font-medium text-slate-600 border-l border-slate-200 pl-2">
            {summary.total_marks} Marks
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Students</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">{summary.total_assigned}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Attempted</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">{summary.total_attempted}</h3>
                <span className="text-sm font-medium text-slate-400">({summary.completion_percentage.toFixed(0)}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Average Score</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">{summary.average_score.toFixed(1)}</h3>
                <span className="text-sm font-medium text-slate-400">/ {summary.total_marks}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pass Rate</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-900">{summary.pass_percentage.toFixed(1)}%</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Student Performance Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Student Performance</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search student..." 
                    className="pl-9 pr-4 py-2 bg-slate-50 border-transparent rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none w-full md:w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                  <Filter className="w-4 h-4 text-slate-400 ml-2" />
                  <select 
                    className="bg-transparent border-none text-sm font-medium text-slate-700 py-1.5 focus:ring-0 cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Status</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="AUTO_SUBMITTED">Auto Submitted</option>
                    <option value="NOT_ATTEMPTED">Not Attempted</option>
                  </select>
                </div>
                <div className="bg-slate-50 rounded-lg p-1">
                  <select 
                    className="bg-transparent border-none text-sm font-medium text-slate-700 py-1.5 focus:ring-0 cursor-pointer"
                    value={resultFilter}
                    onChange={(e) => setResultFilter(e.target.value)}
                  >
                    <option value="ALL">All Results</option>
                    <option value="PASS">Pass</option>
                    <option value="FAIL">Fail</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Marks</th>
                    <th className="px-6 py-4 font-semibold">Result</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.enrollment_number || 'N/A'} • {student.branch || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {student.result === 'NOT_ATTEMPTED' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                              Not Attempted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                              {student.submission_type?.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {student.result === 'NOT_ATTEMPTED' || student.marks_obtained === null ? (
                            <span className="text-slate-400">--</span>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-semibold text-slate-900">{student.marks_obtained}</span>
                              <span className="text-xs text-slate-500">/ {student.total_marks} ({student.percentage?.toFixed(0)}%)</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {student.result === 'PASS' && (
                            <span className="inline-flex items-center text-emerald-600 font-medium">
                              <CheckCircle className="w-4 h-4 mr-1.5" /> Pass
                            </span>
                          )}
                          {student.result === 'FAIL' && (
                            <span className="inline-flex items-center text-rose-600 font-medium">
                              <XCircle className="w-4 h-4 mr-1.5" /> Fail
                            </span>
                          )}
                          {student.result === 'PENDING' && (
                            <span className="text-amber-600 font-medium">Pending</span>
                          )}
                          {student.result === 'NOT_ATTEMPTED' && (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/faculty/exams/${examId}/report/student/${student.student_id}`}
                            className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
                              student.result === 'NOT_ATTEMPTED' 
                                ? 'text-slate-300 pointer-events-none' 
                                : 'text-indigo-600 hover:bg-indigo-50'
                            }`}
                          >
                            <span className="sr-only">View Report</span>
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        {studentsReport.students.length === 0 
                          ? "No students have been assigned to this examination yet."
                          : "No students match the current filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Question Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Question Analysis</h2>
              <p className="text-sm text-slate-500 mt-1">Performance metrics for each question based on submitted attempts.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Q#</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold text-center">Accuracy</th>
                    <th className="px-6 py-4 font-semibold">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questionAnalytics.questions.length > 0 ? (
                    questionAnalytics.questions.map(q => (
                      <tr key={q.question_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">Q{q.question_number}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            {q.question_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {q.difficulty_level === 'MANUAL_EVALUATION' ? (
                            <span className="text-slate-400 text-xs italic block text-center">Requires Manual Eval</span>
                          ) : (
                            <div className="flex items-center gap-3 justify-center">
                              <span className="font-medium text-slate-700 w-12 text-right">{q.accuracy_percentage.toFixed(0)}%</span>
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    q.accuracy_percentage >= 80 ? 'bg-emerald-500' : 
                                    q.accuracy_percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${q.accuracy_percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {q.difficulty_level === 'MANUAL_EVALUATION' ? (
                            <span className="text-slate-400">--</span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              q.difficulty_level === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                              q.difficulty_level === 'Moderate' ? 'bg-amber-50 text-amber-700' :
                              'bg-rose-50 text-rose-700'
                            }`}>
                              {q.difficulty_level}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No questions available for analysis.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Overview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-6">Performance Overview</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 font-medium">Highest Score</span>
                  <span className="text-slate-900 font-bold">{summary.highest_score}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(summary.highest_score / summary.total_marks) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 font-medium">Average Score</span>
                  <span className="text-slate-900 font-bold">{summary.average_score.toFixed(1)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${summary.average_percentage}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 font-medium">Lowest Score</span>
                  <span className="text-slate-900 font-bold">{summary.lowest_score}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(summary.lowest_score / summary.total_marks) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Time Statistics</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Average</span>
                  </div>
                  <div className="font-semibold text-slate-900">{summary.average_time_taken_mins.toFixed(1)}m</div>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Fastest</span>
                  </div>
                  <div className="font-semibold text-slate-900">{summary.fastest_attempt_mins.toFixed(1)}m</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FacultyExamReport;
