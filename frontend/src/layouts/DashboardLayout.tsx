import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout: React.FC = () => {
  const { userRole, violations } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [lastViolationId, setLastViolationId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; severity: string } | null>(null);

  // Redirect to Landing if role is guest
  useEffect(() => {
    if (userRole === 'guest') {
      navigate('/');
    }
  }, [userRole, navigate]);

  // Monitor violations to trigger live warnings/toasts during the exam!
  useEffect(() => {
    if (violations.length > 0) {
      const latest = violations[0];
      if (latest.id !== lastViolationId) {
        setLastViolationId(latest.id);
        setToast({ type: latest.type, severity: latest.severity });
        
        // Auto-dismiss toast after 4s
        const timer = setTimeout(() => {
          setToast(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [violations, lastViolationId]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Real-time AI Violation Warning Toast */}
      {location.pathname.includes('/live') && (
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl flex items-start gap-3 border z-50 max-w-sm glass ${
                toast.severity === 'high' 
                  ? 'border-rose-200 bg-rose-50/90 text-rose-800' 
                  : toast.severity === 'medium'
                  ? 'border-amber-200 bg-amber-50/90 text-amber-800'
                  : 'border-blue-200 bg-blue-50/90 text-blue-800'
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-sm">AI Proctoring Warning</div>
                <div className="text-xs mt-1 font-semibold">
                  Simulated Event Triggered: <span className="underline">{toast.type}</span> ({toast.severity} severity)
                </div>
              </div>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default DashboardLayout;
