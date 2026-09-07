import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Search, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { adminApi } from '../api/admin';
import type { AdminViolationItem } from '../types';

const ViolationLogs: React.FC = () => {
  const [violations, setViolations] = useState<AdminViolationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getAdminViolations(filterType);
      setViolations(data);
    } catch (err: any) {
      console.error('Failed to load violation logs:', err);
      setError(err.response?.data?.detail || 'Failed to fetch violation logs from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [filterType]);

  const handleResolve = async (id: string) => {
    try {
      setResolvingId(id);
      await adminApi.resolveViolation(id);
      setViolations(prev => prev.map(v => {
        if (v.id === id) return { ...v, resolved: true };
        return v;
      }));
    } catch (err: any) {
      console.error('Failed to resolve violation flag:', err);
      alert(err.response?.data?.detail || 'Could not resolve violation flag.');
    } finally {
      setResolvingId(null);
    }
  };

  const filteredViolations = violations.filter(v => {
    const matchesSearch = 
      v.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.exam_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">AI Proctoring Violation Logs</h1>
          <p className="text-slate-500 mt-1 text-sm">Comprehensive audit log of suspicious telemetry and biometric anomalies flagged by the AI engine.</p>
        </div>

        <button
          onClick={fetchViolations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Type:</span>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="All">All Incident Types</option>
            <option value="Eye Deviation">👁️ Eye Deviation</option>
            <option value="Face Missing">👤 Face Missing</option>
            <option value="Multiple Faces">👥 Multiple Faces</option>
            <option value="Phone Detected">📱 Phone Detected</option>
            <option value="Tab Switched">🌐 Tab Switched</option>
            <option value="Voice Detected">🎙️ Voice Detected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retrieving Proctoring Incidents...</p>
          </div>
        ) : filteredViolations.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-semibold text-sm">
            No proctoring violations recorded under current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 md:p-6">Timestamp</th>
                  <th className="p-4 md:p-6">Student</th>
                  <th className="p-4 md:p-6">Assessment</th>
                  <th className="p-4 md:p-6">Incident Type</th>
                  <th className="p-4 md:p-6 text-center">Severity</th>
                  <th className="p-4 md:p-6 text-right">Auditing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredViolations.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 md:p-6 text-slate-400 font-mono text-[11px] font-bold">
                      {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4 md:p-6">
                      <div>
                        <div className="font-extrabold text-slate-800 text-sm">{v.student_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{v.student_email}</div>
                      </div>
                    </td>
                    <td className="p-4 md:p-6 font-semibold text-slate-700 text-xs">{v.exam_title}</td>
                    <td className="p-4 md:p-6">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        {v.type}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border inline-block ${
                        v.severity === 'high' 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : v.severity === 'medium'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                        {v.severity}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-right">
                      {v.resolved ? (
                        <span className="text-emerald-600 flex items-center gap-1 justify-end font-bold text-[11px] uppercase">
                          <CheckCircle className="w-3.5 h-3.5" /> Audited
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleResolve(v.id)}
                          disabled={resolvingId === v.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors inline-flex items-center gap-1.5"
                        >
                          {resolvingId === v.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          Resolve Flag
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViolationLogs;
