import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { PortalConfig } from '../../config/portalConfig';
import { Clock } from 'lucide-react';

interface PortalCardProps {
  portal: PortalConfig;
  index: number;
  isRecentlyUsed: boolean;
}

const PortalCard: React.FC<PortalCardProps> = ({ portal, index, isRecentlyUsed }) => {
  const navigate = useNavigate();
  const Icon = portal.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => navigate(portal.loginPath)}
      className={`glass p-6 rounded-3xl border ${isRecentlyUsed ? `border-${portal.theme.primary} ring-2 ring-${portal.theme.primary}/20 shadow-lg shadow-${portal.theme.primary}/10` : 'border-white/80'} bg-white/90 hover:bg-white backdrop-blur-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full`}
    >
      {/* Decorative background glow */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-${portal.theme.primary} rounded-full filter blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-500`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 ${portal.theme.iconBg} text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:rotate-6`}>
          <Icon className="w-6 h-6" />
        </div>
        
        {isRecentlyUsed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-1 bg-${portal.theme.primary}/10 text-${portal.theme.primary} text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full`}
          >
            <Clock className="w-3 h-3" />
            Recent
          </motion.div>
        )}
      </div>

      <h2 className="text-xl font-extrabold text-slate-800 mb-2 relative z-10">{portal.title}</h2>
      <p className="text-[13px] text-slate-600 leading-relaxed mb-5 relative z-10 font-medium flex-grow">
        {portal.description}
      </p>
      
      {portal.features && portal.features.length > 0 && (
        <ul className="space-y-2.5 mb-6 relative z-10">
          {portal.features.map((feature, i) => (
            <motion.li 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              key={i} 
              className="flex items-center text-[13px] font-semibold text-slate-700"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${portal.theme.iconBg} mr-3 shadow-sm`} />
              {feature}
            </motion.li>
          ))}
        </ul>
      )}
      
      <button className={`w-full py-2.5 mt-auto bg-slate-50 group-hover:bg-slate-100 text-${portal.theme.primary} group-hover:text-${portal.theme.primary} text-sm font-extrabold rounded-xl transition-all duration-300 border border-slate-200 group-hover:border-${portal.theme.primary}/30 shadow-sm relative z-10`}>
        Enter Portal
      </button>
    </motion.div>
  );
};

export default PortalCard;
