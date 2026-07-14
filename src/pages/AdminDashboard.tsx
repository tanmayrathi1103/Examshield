import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Users, ShieldAlert, Cpu, UserCheck, Terminal, Settings } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { students, faculties, violations, auditLogs, aiConfig } = useApp();
  const navigate = useNavigate();

  // Violation distributions
  const violationCounts = violations.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(violationCounts).length > 0 ? Object.keys(violationCounts) : ['Eye deviation', 'Phone Detected', 'Multi-Face', 'Tab Switched'],
    datasets: [
      {
        label: 'System Flags Logged',
        data: Object.keys(violationCounts).length > 0 ? Object.values(violationCounts) : [2, 1, 1, 1],
        backgroundColor: [
          'rgba(99, 102, 241, 0.75)',
          'rgba(239, 68, 68, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(16, 185, 129, 0.75)'
        ],
        borderWidth: 1,
      }
    ]
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">System Administration Console</h1>
        <p className="text-slate-500">Global auditing, AI monitoring sensitivities, and user provisioning.</p>
      </div>

      {/* Admin KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Total Students</div>
            <div className="text-xl font-black text-slate-800 mt-1">{students.length} Provisioned</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Total Faculty</div>
            <div className="text-xl font-black text-slate-800 mt-1">{faculties.length} Officers</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Incident Flags</div>
            <div className="text-xl font-black text-slate-800 mt-1">{violations.length} Alerts</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">AI Severity Mode</div>
            <div className="text-xl font-black text-slate-800 mt-1">{aiConfig.sensitivity} Threshold</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* System incidents breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">AI Behavioral Incident Classifications</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Audit Log Overview */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-2">Recent Administrator Actions</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border rounded-xl text-[10px] font-semibold flex flex-col gap-1">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>{log.user}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-700 mt-0.5">{log.action}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
