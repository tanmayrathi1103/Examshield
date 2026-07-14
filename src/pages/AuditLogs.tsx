import React from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Terminal } from 'lucide-react';

const AuditLogs: React.FC = () => {
  const { auditLogs } = useApp();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">System Audit Logs</h1>
        <p className="text-slate-500">Global immutable database tracking administrator operations and system changes.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-650" />
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Admin Actions Journal</span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4 md:p-6">Timestamp</th>
              <th className="p-4 md:p-6">Operator ID</th>
              <th className="p-4 md:p-6">Operation Action Executed</th>
              <th className="p-4 md:p-6 text-right">IP Node</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 md:p-6 text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4 md:p-6 font-extrabold text-indigo-600">{log.user}</td>
                <td className="p-4 md:p-6 font-bold text-slate-850">{log.action}</td>
                <td className="p-4 md:p-6 text-right font-mono text-slate-400">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
