import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const { setUserRole } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (role: 'student' | 'faculty' | 'admin') => {
    setUserRole(role);
    if (role === 'student') navigate('/student/dashboard');
    else if (role === 'faculty') navigate('/faculty/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('student')) {
      handleLogin('student');
    } else if (email.includes('faculty')) {
      handleLogin('faculty');
    } else if (email.includes('admin')) {
      handleLogin('admin');
    } else {
      setError('Please use the quick login buttons or enter email containing student, faculty, or admin.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-primary-100/50 -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass p-8 rounded-3xl border border-white/50 shadow-2xl bg-white/75"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-sm text-slate-500 mt-1">Access the AI Proctoring Dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="email"
                placeholder="name@examshield.ai"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 pl-12 pr-4 rounded-xl text-sm font-semibold transition-all focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <a href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 pl-12 pr-4 rounded-xl text-sm font-semibold transition-all focus:outline-none"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200/50 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase mb-3">Quick Login (Simulated)</div>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => handleLogin('student')}
              className="py-2.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 transition-colors"
            >
              Student
            </button>
            <button 
              onClick={() => handleLogin('faculty')}
              className="py-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 transition-colors"
            >
              Faculty
            </button>
            <button 
              onClick={() => handleLogin('admin')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
