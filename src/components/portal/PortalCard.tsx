import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { PortalConfig } from '../../config/portalConfig';

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
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => navigate(portal.loginPath)}
      className={`glass p-8 rounded-3xl border ${isRecentlyUsed ? `border-${portal.theme.primary} ring-2 ring-${portal.theme.primary}/20` : 'border-white/50'} shadow-xl bg-white/75 hover:bg-white transition-all cursor-pointer group hover:scale-[1.02] relative`}
    >
      {isRecentlyUsed && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-${portal.theme.primary} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap`}>
          Recently Used
        </div>
      )}
      <div className={`w-14 h-14 ${portal.theme.iconBg} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg ${portal.theme.shadow} transition-transform group-hover:-translate-y-1`}>
        <Icon className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">{portal.title}</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-6">
        {portal.description}
      </p>
      
      {portal.features && portal.features.length > 0 && (
        <ul className="space-y-2 mb-8">
          {portal.features.map((feature, i) => (
            <li key={i} className="flex items-center text-xs font-semibold text-slate-600">
              <span className={`w-1.5 h-1.5 rounded-full ${portal.theme.iconBg} mr-2`} />
              {feature}
            </li>
          ))}
        </ul>
      )}
      
      <button className={`w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-${portal.theme.primary} text-sm font-bold rounded-xl transition-colors border border-slate-200 group-hover:border-${portal.theme.primary}/30`}>
        Enter Portal
      </button>
    </motion.div>
  );
};

export default PortalCard;
