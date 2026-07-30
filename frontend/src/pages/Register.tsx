import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Mail, Lock, ArrowRight, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const Register: React.FC = () => {
  const { register, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !name || !phone || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const user = await register({ 
        full_name: name,
        email, 
        phone_number: phone, 
        password,
        role 
      });
      
      if (user.role === 'student') navigate('/student/dashboard');
      else navigate('/faculty/dashboard');
    } catch (err: any) {
      console.error('Registration failed', err);
    }
  };

  const displayError = error || authError;

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
          <h2 className="text-2xl font-bold text-slate-800">Register Account</h2>
          <p className="text-sm text-slate-500 mt-1">Enroll in the proctored examination platform</p>
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tanmay Rathi"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 pl-12 pr-4 rounded-xl text-sm font-semibold transition-all focus:outline-none"
                required
              />
            </div>
          </div>

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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 pl-12 pr-4 rounded-xl text-sm font-semibold transition-all focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 pl-12 pr-4 rounded-xl text-sm font-semibold transition-all focus:outline-none"
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-100/50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-3 px-4 rounded-xl text-sm font-bold focus:outline-none"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty Member</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 mt-2 flex items-center justify-center gap-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-700 hover:shadow-indigo-500/40'}`}
          >
            {isLoading ? 'Creating Account...' : (
              <>Create Account & Portal Access <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 font-semibold">
          Already have an account? <a href="/login" className="text-indigo-605 hover:underline">Log in</a>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
