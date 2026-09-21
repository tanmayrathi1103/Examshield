import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import type { PortalConfig } from '../../config/portalConfig';
import FloatingIconsBackground from '../FloatingIconsBackground';

interface SharedPortalLayoutProps {
  children: React.ReactNode;
  config?: PortalConfig;
}

const SharedPortalLayout: React.FC<SharedPortalLayoutProps> = ({ children, config }) => {

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#fffdfa] cursor-default">
      
      {/* Interactive Floating Exam Icons (Increased Quantity) */}
      <FloatingIconsBackground count={120} />

      {config ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${config.theme.bgGradient} -z-10 transition-colors duration-1000 opacity-60`} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/50 -z-10" />
      )}

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10 relative">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/10 group-hover:scale-105 transition-transform duration-300 border border-slate-200 overflow-hidden">
            <img src="/logo.png" alt="ExamShield Logo" className="w-full h-full object-cover scale-110" />
          </div>
          <span className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors">
            ExamShield
          </span>
        </Link>
        <div className="flex gap-4">
          <Link to="/about" className="text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors bg-white/60 backdrop-blur-md px-5 py-2 rounded-full border border-orange-100 shadow-sm hover:shadow-md">About</Link>
          <Link to="/contact" className="text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors bg-white/60 backdrop-blur-md px-5 py-2 rounded-full border border-orange-100 shadow-sm hover:shadow-md">Support</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 relative justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 z-10 relative">
        <p className="text-sm font-bold text-slate-500">
          &copy; {new Date().getFullYear()} ExamShield. Enterprise AI Examination Platform.
        </p>
      </footer>
    </div>
  );
};

export default SharedPortalLayout;
