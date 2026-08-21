import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import type { PortalConfig } from '../../config/portalConfig';

interface SharedPortalLayoutProps {
  children: React.ReactNode;
  config?: PortalConfig;
}

const SharedPortalLayout: React.FC<SharedPortalLayoutProps> = ({ children, config }) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
      {/* Background */}
      {config ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${config.theme.bgGradient} -z-10 transition-colors duration-1000`} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-primary-100/50 -z-10" />
      )}

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
            ExamShield
          </span>
        </Link>
        <div className="flex gap-4">
          <Link to="/about" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">About</Link>
          <Link to="/contact" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Support</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 z-10">
        <p className="text-sm font-medium text-slate-500">
          &copy; {new Date().getFullYear()} ExamShield. Enterprise AI Examination Platform.
        </p>
      </footer>
    </div>
  );
};

export default SharedPortalLayout;
