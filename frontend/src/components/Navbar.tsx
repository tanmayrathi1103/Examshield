import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { Bell, User, Laptop, Shield, PlayCircle, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { currentUser, userRole, addViolation, activeExamId, isSidebarCollapsed, toggleSidebar } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showSim, setShowSim] = useState(false);
  return (
    <header className="glass h-16 px-6 border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-40 bg-white/80 transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 active:bg-indigo-50 active:scale-95 rounded-xl transition-all duration-200 border border-slate-200/60 shadow-xs"
          title={isSidebarCollapsed ? "Expand Sidebar (☰)" : "Collapse Sidebar (☰)"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-extrabold text-slate-800 capitalize tracking-tight">
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

        <div className="flex items-center gap-4 pl-4 border-l border-slate-200/80">
          <div className="text-right hidden sm:flex flex-col items-end justify-center">
            <div className="text-sm font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
              {currentUser?.full_name || 'User'}
            </div>
            <div className="inline-flex items-center justify-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">
              {userRole}
            </div>
          </div>
          
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-lg shadow-indigo-500/30 ring-2 ring-white transition-transform duration-300 group-hover:scale-105">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm z-10" />
          </div>
          
        </div>
      </div>
    </header>
  );
};

export default Navbar;
