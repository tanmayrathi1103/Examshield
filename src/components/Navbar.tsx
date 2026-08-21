import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { Bell, User, Laptop, Shield, PlayCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { currentUser, userRole, addViolation, activeExamId } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showSim, setShowSim] = useState(false);
  return (
    <header className="glass h-16 px-6 border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-40 bg-white/80">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 capitalize">
          {userRole} Portal
        </h2>

      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Violation Simulator (Sticky Control Panel) */}
        {activeExamId && (
          <div className="relative">
            <button
              onClick={() => setShowSim(!showSim)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-sm font-bold border border-amber-200 transition-colors animate-pulse"
            >
              <PlayCircle className="w-4 h-4" />
              Simulate AI Violations
            </button>

            {showSim && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 z-50">
                <div className="text-xs font-bold text-slate-400 uppercase pb-1 border-b">Trigger Simulated Event</div>
                <button
                  onClick={() => { addViolation('Eye Deviation', 'low'); setShowSim(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg text-slate-700"
                >
                  👁️ Eye Gaze Off-screen (Low)
                </button>
                <button
                  onClick={() => { addViolation('Face Missing', 'medium'); setShowSim(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg text-slate-700"
                >
                  👤 Face Not Detected (Med)
                </button>
                <button
                  onClick={() => { addViolation('Multiple Faces', 'high'); setShowSim(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg text-slate-700"
                >
                  👥 Multiple Faces (High)
                </button>
                <button
                  onClick={() => { addViolation('Phone Detected', 'high'); setShowSim(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg text-slate-700"
                >
                  📱 Mobile Phone Detected (High)
                </button>
                <button
                  onClick={() => { addViolation('Tab Switched', 'high'); setShowSim(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 rounded-lg text-slate-700"
                >
                  🌐 Browser Tab Switched (High)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications and Profile */}
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-slate-800">
              {currentUser?.full_name || 'User'}
            </div>
            <div className="text-xs text-slate-400 font-medium capitalize">{userRole}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
            {userRole.charAt(0).toUpperCase()}
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="ml-2 p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
