import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, ArrowRight, ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PortalConfig } from '../../config/portalConfig';
import { navigateAfterLogin } from '../../utils/portalNavigator';
import { useNavigate } from 'react-router-dom';

interface SharedLoginProps {
  config: PortalConfig;
}

const SharedLogin: React.FC<SharedLoginProps> = ({ config }) => {
  const { login, logout, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');̦̦
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const user = await login({ email, password });
      
      // Role Validation
      if (user.role !== config.expectedRole) {
        await logout(); // Discard the token
        setError(`This account belongs to the ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal. Please sign in through the correct portal.`);
        return;
      }
      
      // Remember last portal
      localStorage.setItem('lastUsedPortal', config.id);

      // Future compatibility: Post-login flow handled by portalNavigator
      navigateAfterLogin(config, navigate);
    } catch (err: any) {
      // Error is already handled and stored in authError by the hook
      console.error('Login failed', err);
    }
  };

  const displayError = error || authError;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      
      {/* Breadcrumbs */}
      <div className="w-full max-w-md mb-6 flex items-center text-sm font-semibold text-slate-500">
        <Link to="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1"><Home className="w-4 h-4" /> Home</Link>
        <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
        <Link to="/login" className="hover:text-indigo-600 transition-colors">Portals</Link>
        <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
        <span className={`text-${config.theme.primary}`}>{config.title}</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass p-8 rounded-3xl border border-white/50 shadow-2xl bg-white/75 relative"
      >
        <div className="flex flex-col items-center mt-2 mb-8">
          <div className={`w-12 h-12 ${config.theme.iconBg} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg ${config.theme.shadow}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{config.title}</h2>
          <p className="text-sm text-slate-500 mt-1 text-center px-4">{config.subtitle}</p>
        </div>

        {displayError && (
          <div className="mb-6 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100 flex items-start text-left">
            <span className="mt-0.5">{displayError}</span>
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
            disabled={isLoading}
            className={`w-full py-3.5 ${config.theme.iconBg} text-white rounded-xl font-bold text-sm transition-all shadow-lg ${config.theme.shadow} flex items-center justify-center gap-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:brightness-110 hover:shadow-xl'}`}
          >
            {isLoading ? 'Verifying Account...' : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SharedLogin;
