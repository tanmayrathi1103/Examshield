import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, RefreshCw, Database, ShieldCheck } from 'lucide-react';
import { adminApi } from '../api/admin';
import type { AuditLogItem } from '../types';

const AuditLogs: React.FC = () => {
  const { auditLogs: contextLogs } = useApp();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchLogs = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await adminApi.getAuditLogs(50);
      if (data && data.length > 0) {
        setLogs(data);
      } else {
        // Fallback to local logs
        setLogs(contextLogs.map(l => ({
          id: l.id,
          user: l.user,
          action: l.action,
          timestamp: l.timestamp,
          ip: l.ip
        })));
      }
    } catch (err) {
      console.warn('Could not fetch audit logs from backend, using context logs:', err);
      setLogs(contextLogs.map(l => ({
        id: l.id,
        user: l.user,
        action: l.action,
        timestamp: l.timestamp,
        ip: l.ip
      })));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [contextLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            System Audit Logs
            <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              PostgreSQL Journal
            </span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Immutable database records tracking administrator operations, AI policy adjustments, and system events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">
              Admin & Security Audit Trail
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {logs.length} Logged Events
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 text-sm font-semibold">Retrieving audit journals from PostgreSQL...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-sm">
            No audit events found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 md:p-5">Timestamp</th>
                  <th className="p-4 md:p-5">Operator Email</th>
                  <th className="p-4 md:p-5">Operation Action Executed</th>
                  <th className="p-4 md:p-5 text-right">Node IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 md:p-5 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 md:p-5 font-bold text-indigo-600">
                      {log.user}
                    </td>
                    <td className="p-4 md:p-5 font-medium text-slate-800">
                      {log.action}
                    </td>
                    <td className="p-4 md:p-5 text-right font-mono text-slate-400 text-[11px]">
                      {log.ip}
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

export default AuditLogs;
