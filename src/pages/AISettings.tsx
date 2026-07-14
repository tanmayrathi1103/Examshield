import React from 'react';
import { useApp } from '../context/AppContext';
import { Check, Settings, ShieldAlert, Cpu } from 'lucide-react';

const AISettings: React.FC = () => {
  const { aiConfig, setAiConfig, addAuditLog } = useApp();

  const handleToggle = (key: keyof typeof aiConfig) => {
    setAiConfig(prev => {
      const next = { ...prev, [key]: !prev[key] };
      addAuditLog(`Toggled AI Setting: ${key} to ${next[key] ? 'ENABLED' : 'DISABLED'}`);
      return next;
    });
  };

  const handleSensitivity = (val: string) => {
    setAiConfig(prev => {
      const next = { ...prev, sensitivity: val };
      addAuditLog(`Set AI Proctoring Sensitivity threshold to ${val.toUpperCase()}`);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">AI Proctoring Configurations</h1>
        <p className="text-slate-500">Tune sensitivity triggers and computer vision models globally.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Proctor Sensor Array Sensitivity
        </h3>

        {/* Sensitivity Selector */}
        <div className="grid grid-cols-3 gap-4">
          {['Low', 'Medium', 'High'].map((level) => {
            const isSelected = aiConfig.sensitivity === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => handleSensitivity(level)}
                className={`py-4 rounded-xl font-bold border transition-all text-xs flex flex-col items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-indigo-650/10 border-indigo-600 text-indigo-700 shadow-md shadow-indigo-600/5' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>{level} Threshold</span>
                <span className="text-[9px] font-medium text-slate-400">
                  {level === 'Low' && 'Generous checks'}
                  {level === 'Medium' && 'Standard proctoring'}
                  {level === 'High' && 'Strict lockout rules'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Model Toggles */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            AI Computer Vision Modules
          </h3>

          <div className="space-y-4">
            {/* Face Detection */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Biometric Face Signature Track</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Identifies student facial structure continuously.</p>
              </div>
              <button 
                type="button" 
                onClick={() => handleToggle('faceDetection')}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  aiConfig.faceDetection ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  aiConfig.faceDetection ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Eye Tracking */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Eye Gaze Vector Analysis</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Flags instances where eyes deviate from the browser screen area.</p>
              </div>
              <button 
                type="button" 
                onClick={() => handleToggle('eyeTracking')}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  aiConfig.eyeTracking ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  aiConfig.eyeTracking ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Phone Detection */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Optical Object Classifiers</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Flags secondary devices like mobile phones or textbooks.</p>
              </div>
              <button 
                type="button" 
                onClick={() => handleToggle('phoneDetection')}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  aiConfig.phoneDetection ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  aiConfig.phoneDetection ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Tab Lockout */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">Tab Switch Lockout Sandbox</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Enforces lockdown environment, auto-submits exam on escape bounds.</p>
              </div>
              <button 
                type="button" 
                onClick={() => handleToggle('tabLockout')}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  aiConfig.tabLockout ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  aiConfig.tabLockout ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
