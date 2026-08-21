import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { portals } from '../config/portalConfig';
import PortalCard from '../components/portal/PortalCard';
import SharedPortalLayout from '../components/portal/SharedPortalLayout';

const PortalSelection: React.FC = () => {
  const [lastUsedPortal, setLastUsedPortal] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lastUsedPortal');
    if (saved) {
      setLastUsedPortal(saved);
    }
  }, []);

  return (
    <SharedPortalLayout>
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">ExamShield Portals</h1>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto">
            Select your portal to securely access the platform.
          </p>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((portal, index) => (
            <PortalCard 
              key={portal.id}
              portal={portal} 
              index={index} 
              isRecentlyUsed={lastUsedPortal === portal.id} 
            />
          ))}
        </div>
      </div>
    </SharedPortalLayout>
  );
};

export default PortalSelection;
