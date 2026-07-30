import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center space-y-6 bg-slate-50">
      <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/5">
        <ShieldAlert className="w-8 h-8" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-800">404 - Page Missing</h1>
        <p className="text-slate-500 text-sm max-w-sm">The path coordinates requested are invalid or restricted under current authentication privileges.</p>
      </div>

      <button 
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back Home
      </button>
    </div>
  );
};

export default NotFound;
