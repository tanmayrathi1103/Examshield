import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, AlertTriangle, CheckCircle, Search } from 'lucide-react';

const ViolationLogs: React.FC = () => {
  const { violations, setViolations, addAuditLog } = useApp();
  const [filterType, setFilterType] = useState('All');

  const handleResolve = (id: string, type: string) => {
    setViolations(prev => prev.map(v => {
      if (v.id === id) return { ...v, resolved: true };
      return v;
    }));
    addAuditLog(`Resolved violation flag ID: ${id} (${type})`);
  };

  const filteredViolations = violations.filter(v => 
    filterType === 'All' ? true : v.type === filterType
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">AI Violation Logs</h1>
          <p className="text-slate-500">View and resolve proctoring incidents flagged by AI.</p>
        </div>

        {/* Filter */}
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
        >
          <option value="All">Filter by Incident</option>
          <option value="Eye Deviation">👁️ Eye Deviation</option>
          <option value="Face Missing">👤 Face Missing</option>
          <option value="Multiple Faces">👥 Multiple Faces</option>
          <option value="Phone Detected">📱 Phone Detected</option>
          <option value="Tab Switched">🌐 Tab Switched</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
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
                <td className="p-4 md:p-6 text-slate-400 font-bold">{new Date(v.timestamp).toLocaleTimeString()}</td>
                <td className="p-4 md:p-6 font-extrabold text-slate-850">{v.studentName}</td>
                <td className="p-4 md:p-6">{v.examTitle}</td>
                <td className="p-4 md:p-6">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-slate-450" />
                    {v.type}
                  </span>
                </td>
                <td className="p-4 md:p-6 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    v.severity === 'high' 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                      : v.severity === 'medium'
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}>
                    {v.severity}
                  </span>
                </td>
                <td className="p-4 md:p-6 text-right">
                  {v.resolved ? (
                    <span className="text-emerald-500 flex items-center gap-1 justify-end font-bold text-[10px] uppercase">
                      <CheckCircle className="w-3.5 h-3.5" /> Audited
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleResolve(v.id, v.type)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black shadow-md shadow-indigo-600/10 transition-colors"
                    >
                      Resolve Flag
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViolationLogs;
