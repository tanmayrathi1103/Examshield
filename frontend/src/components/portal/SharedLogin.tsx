import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, ArrowRight, ChevronRight, Home, Fingerprint, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PortalConfig } from '../../config/portalConfig';
import { navigateAfterLogin } from '../../utils/portalNavigator';
import { useNavigate } from 'react-router-dom';

interface SharedLoginProps {
  config: PortalConfig;
}

const SharedLogin: React.FC<SharedLoginProps> = ({ config }) => {
  const { login, logout, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const user = await login({ email, password });
      
      const isRoleAllowed = user.role === config.expectedRole || (config.expectedRole === 'admin' && user.role === 'super_admin');
      if (!isRoleAllowed) {
        await logout();
        setError('Access denied. Invalid credentials or unauthorized for this portal.');
        return;
      }
      
      localStorage.setItem('lastUsedPortal', config.id);
      navigateAfterLogin(config, navigate);
    } catch (err: any) {
      console.error('Login failed', err);
    }
  };

  const displayError = error || authError;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 relative w-full h-full min-h-[calc(100vh-160px)] z-10">
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        className="w-full max-w-4xl flex flex-col md:flex-row rounded-[2rem] border border-white/80 shadow-2xl shadow-indigo-900/10 overflow-hidden bg-white/70 backdrop-blur-xl relative"
      >
        {/* Left Branding Pane */}
        <div className={`w-full md:w-5/12 bg-${config.theme.primary} p-10 flex flex-col justify-between relative overflow-hidden text-white border-r border-white/20`}>
          {/* Decorative Rings */}
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full border-[20px] border-white/10 opacity-50" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full border-[10px] border-white/10 opacity-50" />
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-wide uppercase">Return Home</span>
            </Link>

            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
            >
              <Icon className={`w-8 h-8 text-${config.theme.primary}`} />
            </motion.div>
            
            <h2 className="text-4xl font-extrabold tracking-tight mb-3">{config.title}</h2>
            <p className="text-white/80 font-medium leading-relaxed">{config.subtitle}</p>
          </div>

          <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-white shrink-0 mt-0.5" />
            <p className="text-xs text-white/90 font-medium">Secured by AI-Powered Behavioral Analysis and telemetry tracking.</p>
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="w-full md:w-7/12 p-10 md:p-14 bg-white/90 relative z-10">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800">Welcome Back</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">Please enter your credentials to access your portal.</p>
          </div>

          <AnimatePresence>
            {displayError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mb-6 p-4 bg-gradient-to-br from-rose-50/95 via-rose-50/70 to-white rounded-2xl border border-rose-200/90 shadow-sm shadow-rose-900/5 space-y-3.5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100/90 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Authentication Notice
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-rose-700/90 leading-relaxed mt-0.5">
                      {displayError}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-rose-200/60 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-rose-800/80 hidden sm:inline">
                    Looking for a different portal?
                  </span>
                  <Link 
                    to="/login" 
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200/90 hover:border-rose-600 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 group ml-auto"
                  >
                    <span>Switch Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div 
              className="space-y-2"
              animate={{ x: isFocused === 'email' ? 4 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <label className={`text-xs font-bold uppercase tracking-wider pl-1 transition-colors ${isFocused === 'email' ? `text-${config.theme.primary}` : 'text-slate-500'}`}>Email Address</label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-3.5 w-5 h-5 transition-colors ${isFocused === 'email' ? `text-${config.theme.primary}` : 'text-slate-400'}`} />
                <input 
                  type="email"
                  placeholder="name@examshield.ai"
                  value={email}
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused(null)}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-slate-200 focus:border-${config.theme.primary} py-3.5 pl-12 pr-4 rounded-xl text-sm font-semibold transition-all focus:outline-none shadow-sm`}
                  required
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              animate={{ x: isFocused === 'password' ? 4 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center px-1">
                <label className={`text-xs font-bold uppercase tracking-wider transition-colors ${isFocused === 'password' ? `text-${config.theme.primary}` : 'text-slate-500'}`}>Password</label>
                <a href="/forgot-password" className={`text-xs font-bold text-${config.theme.primary} hover:underline`}>Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className={`absolute left-4 top-3.5 w-5 h-5 transition-colors ${isFocused === 'password' ? `text-${config.theme.primary}` : 'text-slate-400'}`} />
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-slate-200 focus:border-${config.theme.primary} py-3.5 pl-12 pr-4 rounded-xl text-sm font-semibold transition-all focus:outline-none shadow-sm`}
                  required
                />
              </div>
            </motion.div>

            <motion.button 
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              disabled={isLoading}
              className={`w-full mt-6 py-4 bg-${config.theme.primary} text-white rounded-xl font-extrabold text-sm transition-all shadow-lg hover:shadow-xl hover:opacity-90 flex items-center justify-center gap-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  Access Portal <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SharedLogin;
