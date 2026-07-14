import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, ShieldCheck } from 'lucide-react';

const Settings: React.FC = () => {
  const { addAuditLog } = useApp();
  const [instName, setInstName] = useState('ExamShield Institute of Tech');
  const [sessTimeout, setSessTimeout] = useState(120);
  const [retention, setRetention] = useState(90);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addAuditLog(`Updated global settings. Institution: "${instName}", Retention: ${retention} days`);
    alert('Settings successfully updated.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Global Settings</h1>
        <p className="text-slate-500">Configure global parameters and security thresholds.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-650" />
          Institution & Compliance Parameters
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institution Name</label>
            <input
              type="text"
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
              className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Timeout (Mins)</label>
              <input
                type="number"
                value={sessTimeout}
                onChange={(e) => setSessTimeout(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Retention (Days)</label>
              <input
                type="number"
                value={retention}
                onChange={(e) => setRetention(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
