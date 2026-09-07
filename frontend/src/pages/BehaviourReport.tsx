import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Calendar, Clock, AlertTriangle, FileText, CheckCircle, ArrowLeft,
  ShieldCheck, AlertCircle, Eye, Smartphone, RefreshCw
} from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { examsApi } from '../api/exams';
import type { StudentDetailReportResponse } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const BehaviourReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  const studentId = searchParams.get('studentId');
  const navigate = useNavigate();

  const [report, setReport] = useState<StudentDetailReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isStaffView = Boolean(studentId);

  const handleBack = () => {
    if (isStaffView) {
      navigate('/faculty/student-reports');
    } else {
      navigate('/student/history');
    }
  };

  useEffect(() => {
    if (!examId) {
      setError("No examination specified. Please select an exam from your history.");
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        let data: StudentDetailReportResponse;
        if (studentId) {
          data = await examsApi.getStudentDetailReport(examId, studentId);
        } else {
          data = await examsApi.getMyReport(examId);
        }
        setReport(data);
      } catch (err: any) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : err.message || 'Failed to load compliance report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [examId, studentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 max-w-7xl mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="text-sm font-semibold text-slate-500">Generating AI integrity & telemetry report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-rose-50 text-rose-700 p-8 rounded-3xl border border-rose-200 flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Unable to Load Report</h3>
            <p className="text-sm text-rose-600 max-w-md">{error || "No report data found for this examination."}</p>
          </div>
          <button 
            onClick={handleBack}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            {isStaffView ? 'Back to Student Reports' : 'Back to Exam History'}
          </button>
        </div>
      </div>
    );
  }

  const { student, proctoring_events = [] } = report;

  // Compute metrics from actual proctoring events
  const totalViolations = proctoring_events.filter(e => 
    !['STARTED', 'RESUMED', 'SUBMITTED', 'AUTO_SUBMITTED'].includes(e.event_type.toUpperCase())
  );

  const totalIncidents = totalViolations.length;
  // Calculate integrity score (100 - 10 per violation, clamped to 20..100)
  const integrityScore = Math.max(20, Math.min(100, 100 - (totalIncidents * 10)));

  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  let riskColor = 'text-emerald-500 bg-emerald-50 border-emerald-100';
  if (integrityScore < 60) {
    riskLevel = 'High';
    riskColor = 'text-rose-500 bg-rose-50 border-rose-100';
  } else if (integrityScore < 85) {
    riskLevel = 'Medium';
    riskColor = 'text-amber-500 bg-amber-50 border-amber-100';
  }

  // Format event types for human readability
  const formatEventType = (type: string) => {
    return type
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Incident counts by type
  const violationCounts = totalViolations.reduce((acc, curr) => {
    const formatted = formatEventType(curr.event_type);
    acc[formatted] = (acc[formatted] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barLabels = Object.keys(violationCounts).length > 0 
    ? Object.keys(violationCounts) 
    : ['No Incidents'];
  const barValues = Object.keys(violationCounts).length > 0 
    ? Object.values(violationCounts) 
    : [0];

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Incidents Flagged',
        data: barValues,
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: ['Compliance Score', 'Incident Penalties'],
    datasets: [
      {
        data: [integrityScore, 100 - integrityScore],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgb(16, 185, 129)', 'rgb(239, 68, 68)'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={handleBack}
            className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> {isStaffView ? 'Back to Student Reports' : 'Back to History'}
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Compliance & Integrity Report</h1>
          <p className="text-slate-500 mt-1">
            Session telemetry for <span className="font-semibold text-slate-700">{student.name}</span>
            {student.enrollment_number && ` (${student.enrollment_number})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${riskColor}`}>
            {riskLevel} Risk Level
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
            Result: {student.result}
          </span>
        </div>
      </div>

      {/* Grid: Overview scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Integrity Rating</div>
          <div className={`text-3xl font-black mt-2 ${
            integrityScore >= 90 ? 'text-emerald-500' : integrityScore >= 75 ? 'text-amber-500' : 'text-rose-500'
          }`}>
            {integrityScore}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full ${integrityScore >= 90 ? 'bg-emerald-500' : integrityScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${integrityScore}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-medium">Target baseline: &gt; 75%</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Incidents</div>
          <div className="text-3xl font-black text-slate-800 mt-2">{totalIncidents}</div>
          <div className="text-[10px] text-slate-400 mt-3 font-medium">Logged across optical & browser checks</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Obtained</div>
          <div className="text-3xl font-black text-slate-800 mt-2">
            {student.marks_obtained !== null && student.marks_obtained !== undefined ? student.marks_obtained : '--'}
            <span className="text-base text-slate-400 font-normal"> / {student.total_marks}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-3 font-medium">
            Percentage: {student.percentage !== null && student.percentage !== undefined ? `${student.percentage.toFixed(1)}%` : 'N/A'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Status</div>
          <div className="flex items-center gap-2 mt-2">
            {student.result === 'PASS' ? (
              <div className="text-base font-extrabold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5" /> Passed Compliance
              </div>
            ) : (
              <div className="text-base font-extrabold text-rose-600 flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5" /> {student.result}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-3 font-medium">
            Submission: {student.submission_type || 'STANDARD'}
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Incident Category Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            {totalIncidents === 0 ? (
              <div className="text-sm text-slate-400 font-medium text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                No proctoring violations recorded during this session!
              </div>
            ) : (
              <Bar 
                data={barData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Integrity Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Detailed session timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Session Audit Timeline</h3>
          <span className="text-xs text-slate-400 font-medium">{proctoring_events.length} Total Telemetry Events</span>
        </div>
        
        <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
          {proctoring_events.length === 0 ? (
            <div className="text-sm text-slate-400 italic pl-8">No incident logs registered during this session. Integrity validated.</div>
          ) : (
            proctoring_events.map((v) => {
              const eventTypeUpper = v.event_type.toUpperCase();
              const isInfo = ['STARTED', 'RESUMED', 'SUBMITTED', 'AUTO_SUBMITTED', 'PROCTORING_STARTED'].includes(eventTypeUpper);
              const isWarning = ['LOOKING_AWAY', 'WARNING'].includes(eventTypeUpper);
              
              let badgeColor = 'bg-rose-500';
              if (isInfo) badgeColor = 'bg-indigo-500';
              else if (isWarning) badgeColor = 'bg-amber-500';

              return (
                <div key={v.id} className="flex gap-6 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-white z-10 shadow-xs ${badgeColor}`}>
                    {isInfo ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex-1 space-y-1">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="font-extrabold text-slate-800 text-sm">
                        {formatEventType(v.event_type)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(v.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {v.event_data && Object.keys(v.event_data).length > 0 && (
                      <p className="text-xs text-slate-500 leading-relaxed font-mono bg-white/70 p-2 rounded-lg border border-slate-100 mt-1">
                        {JSON.stringify(v.event_data)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex gap-4">
        <button 
          onClick={handleBack}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
        >
          {isStaffView ? 'Back to Student Reports' : 'Back to Exam History'}
        </button>
        <button 
          onClick={() => navigate(isStaffView ? '/faculty/dashboard' : '/student/dashboard')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shadow-indigo-200"
        >
          {isStaffView ? 'Go to Faculty Dashboard' : 'Go to Student Dashboard'}
        </button>
      </div>
    </div>
  );
};

export default BehaviourReport;

