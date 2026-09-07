import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Cpu, UserCheck, RefreshCw, Loader2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';
import type { AdminStatsResponse } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getAdminStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load admin dashboard stats:', err);
      setError(err.response?.data?.detail || 'Failed to fetch admin stats from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const violationDistribution = stats?.violation_distribution || {};
  const labels = Object.keys(violationDistribution);
  const dataValues = Object.values(violationDistribution);

  const chartData = {
    labels: labels.length > 0 ? labels : ['No Incidents'],
    datasets: [
      {
        label: 'System Flags Logged',
        data: dataValues.length > 0 ? dataValues : [1],
        backgroundColor: [
          'rgba(99, 102, 241, 0.85)',
          'rgba(239, 68, 68, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(236, 72, 153, 0.85)',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    ]
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Administration Console</h1>
          <p className="text-slate-500 mt-1 text-sm">Global auditing, AI monitoring sensitivities, and user provisioning overview.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/violation-logs')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>View All Violations</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compiling System Metrics...</p>
        </div>
      ) : (
        <>
          {/* Admin KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              onClick={() => navigate('/students-directory')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</div>
                <div className="text-2xl font-black text-slate-800 mt-0.5">{stats?.total_students ?? 0} Enrolled</div>
              </div>
            </div>

            <div 
              onClick={() => navigate('/faculty-directory')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Faculty</div>
                <div className="text-2xl font-black text-slate-800 mt-0.5">{stats?.total_faculty ?? 0} Officers</div>
              </div>
            </div>

            <div 
              onClick={() => navigate('/violation-logs')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Flags</div>
                <div className="text-2xl font-black text-slate-800 mt-0.5">{stats?.total_violations ?? 0} Alerts</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Severity Mode</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{stats?.ai_sensitivity || 'High (Strict)'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* System incidents breakdown */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">AI Behavioral Incident Classifications</h3>
                <span className="text-xs font-bold text-slate-400">{stats?.total_violations ?? 0} Total Events</span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Pie 
                  data={chartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          font: {
                            family: 'Inter, system-ui, sans-serif',
                            size: 11,
                            weight: 'bold'
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Audit Log Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b">Recent Proctoring & Audit Actions</h3>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
                {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                  stats.recent_activity.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-semibold flex flex-col gap-1">
                      <div className="flex justify-between text-slate-400 font-bold text-[10px]">
                        <span className="truncate max-w-[180px]">{log.user}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-700 mt-0.5">{log.action}</div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    No recent activities recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
