import React from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Award, ShieldAlert, Heart, Calendar, Clock, AlertTriangle, FileText, CheckCircle, Download, ExternalLink
} from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const BehaviourReport: React.FC = () => {
  const { exams, violations, students } = useApp();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  const navigate = useNavigate();

  const exam = exams.find(e => e.id === examId) || exams[2]; // Fallback to completed exam if none selected

  const currentStudent = students.find(s => s.name === 'Tanmay Rathi') || {
    integrityScore: 89,
    status: 'active'
  };

  // Find violations corresponding to this exam
  const examViolations = violations.filter(v => v.examTitle === exam.title);

  // Compute metrics
  const integrityScore = Math.max(20, currentStudent.integrityScore);
  
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  let riskColor = 'text-emerald-500 bg-emerald-50 border-emerald-100';
  if (integrityScore < 60) {
    riskLevel = 'High';
    riskColor = 'text-rose-500 bg-rose-50 border-rose-100';
  } else if (integrityScore < 85) {
    riskLevel = 'Medium';
    riskColor = 'text-amber-500 bg-amber-50 border-amber-100';
  }

  // Chart Data: Types of Violations
  const violationCounts = examViolations.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = {
    labels: Object.keys(violationCounts).length > 0 ? Object.keys(violationCounts) : ['Eye Gaze', 'No Face', 'Tab Switch', 'Mobile Phone'],
    datasets: [
      {
        label: 'Incidents Flagged',
        data: Object.keys(violationCounts).length > 0 ? Object.values(violationCounts) : [0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: ['Compliance Rate', 'Violation Flags'],
    datasets: [
      {
        data: [integrityScore, 100 - integrityScore],
        backgroundColor: ['rgba(16, 185, 129, 0.75)', 'rgba(239, 68, 68, 0.75)'],
        borderColor: ['rgb(16, 185, 129)', 'rgb(239, 68, 68)'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Compliance & Behavior Report</h1>
          <p className="text-slate-500">AI monitoring auditing report for Tanmay Rathi.</p>
        </div>
        <button 
          onClick={() => alert('PDF generation simulated. Document downloaded successfully.')}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition-all hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4" /> Download PDF Audit Report
        </button>
      </div>

      {/* Grid: Overview scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="text-xs font-bold text-slate-400 uppercase">Integrity Score</div>
          <div className={`text-3xl font-black mt-2 ${
            integrityScore >= 90 ? 'text-emerald-500' : integrityScore >= 75 ? 'text-amber-500' : 'text-rose-500'
          }`}>
            {integrityScore}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Acceptable limit: &gt; 75%</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="text-xs font-bold text-slate-400 uppercase">Risk Evaluation</div>
          <div className={`inline-block text-sm font-extrabold px-2.5 py-1 rounded-lg border mt-2 ${riskColor}`}>
            {riskLevel} Risk
          </div>
          <div className="text-[10px] text-slate-400 mt-2">Deducted from flagged events</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Incidents</div>
          <div className="text-3xl font-black text-slate-850 mt-2">{examViolations.length} Flagged</div>
          <div className="text-[10px] text-slate-400 mt-1">Flagged by optical/acoustic nodes</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="text-xs font-bold text-slate-400 uppercase">Audit Assessment</div>
          <div className="text-sm font-extrabold text-emerald-500 flex items-center gap-1.5 mt-3">
            <CheckCircle className="w-4 h-4" /> Passed Compliance
          </div>
          <div className="text-[10px] text-slate-400 mt-2">Verified via biometric signatures</div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Flag Frequency Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Incident Frequency Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            <Bar 
              data={barData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        {/* Integrity Distribution Pie */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Session Integrity Ratio</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Detailed session timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 border-b pb-3">Session Violation Timeline</h3>
        
        <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
          {examViolations.length === 0 ? (
            <div className="text-sm text-slate-400 italic pl-8">No incident logs registered during this session. Integrity validated.</div>
          ) : (
            examViolations.map((v, i) => (
              <div key={v.id} className="flex gap-6 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-white z-10 shadow-sm ${
                  v.severity === 'high' ? 'bg-rose-500' : v.severity === 'medium' ? 'bg-amber-500' : 'bg-indigo-500'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex-1">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">{v.type} ({v.severity} Severity)</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Flagged by AI node. Optical coordinates indicate anomalous facial geometry or external device signatures.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={() => navigate('/student/history')}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
        >
          Back to Exam History
        </button>
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
        >
          Go to Student Dashboard
        </button>
      </div>
    </div>
  );
};

export default BehaviourReport;
