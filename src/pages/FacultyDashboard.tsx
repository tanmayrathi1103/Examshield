import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, FileText, CheckSquare, ShieldAlert, TrendingUp, Monitor } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

const FacultyDashboard: React.FC = () => {
  const { students, exams, violations } = useApp();
  const navigate = useNavigate();

  const totalStudents = students.length;
  const activeExams = exams.filter(e => e.status === 'upcoming').length;
  const totalViolationsCount = violations.length;

  // Chart Data: Student Trust distribution
  const chartData = {
    labels: students.map(s => s.name),
    datasets: [
      {
        label: 'Integrity Trust Index (%)',
        data: students.map(s => s.integrityScore),
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderRadius: 8,
      }
    ]
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Faculty Administration</h1>
        <p className="text-slate-500">Manage assessments, question banks, and live AI monitoring feeds.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Monitored Students</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalStudents} Students</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Scheduled Exams</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{activeExams} Active</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">System Violations</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalViolationsCount} Flags</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Avg Trust Index</div>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {Math.round(students.reduce((acc, curr) => acc + curr.integrityScore, 0) / students.length)}%
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Chart and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Compliance Graph */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Student Integrity Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Bar 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        {/* Shortcuts / Quick Actions */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Faculty Console</h3>
          
          <button 
            onClick={() => navigate('/faculty/live-monitoring')}
            className="w-full p-4 hover:bg-slate-50 border rounded-xl transition-all flex items-center gap-3 text-left font-bold text-slate-700 text-sm"
          >
            <Monitor className="w-5 h-5 text-indigo-600" />
            <div>
              <div>Live Monitor Feed</div>
              <div className="text-[10px] text-slate-400 font-medium">Watch student cameras and triggers real time.</div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/faculty/create-exam')}
            className="w-full p-4 hover:bg-slate-50 border rounded-xl transition-all flex items-center gap-3 text-left font-bold text-slate-700 text-sm"
          >
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <div>Configure New Exam</div>
              <div className="text-[10px] text-slate-400 font-medium">Write title, durations, and scheduled dates.</div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/faculty/questions')}
            className="w-full p-4 hover:bg-slate-50 border rounded-xl transition-all flex items-center gap-3 text-left font-bold text-slate-700 text-sm"
          >
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <div>
              <div>Maintain Question Bank</div>
              <div className="text-[10px] text-slate-400 font-medium">View, edit, or add items to core database.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
