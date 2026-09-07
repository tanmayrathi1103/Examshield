import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Check, Settings, ShieldAlert, Cpu, Database, 
  RefreshCw, CheckCircle2, AlertCircle, Sliders, Shield
} from 'lucide-react';
import { adminApi } from '../api/admin';
import type { AISettingsConfig } from '../types';

const AISettings: React.FC = () => {
  const { aiConfig, setAiConfig, addAuditLog } = useApp();

  const [settings, setSettings] = useState<AISettingsConfig>({
    face_detection: aiConfig.faceDetection ?? true,
    eye_tracking: aiConfig.eyeTracking ?? true,
    phone_detection: aiConfig.phoneDetection ?? true,
    voice_detection: aiConfig.voiceDetection ?? true,
    multi_face_detection: aiConfig.multiFaceDetection ?? true,
    tab_lockout: aiConfig.tabLockout ?? true,
    sensitivity: (aiConfig.sensitivity as 'Low' | 'Medium' | 'High') || 'Medium',
    allowed_violations: aiConfig.allowedViolations ?? 3,
    warnings_before_submit: aiConfig.warningsBeforeSubmit ?? 2
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // 1. Fetch persistent settings from Database on mount
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await adminApi.getAISettings();
        if (mounted && data) {
          setSettings(data);
          // Sync with AppContext
          setAiConfig(prev => ({
            ...prev,
            faceDetection: data.face_detection,
            eyeTracking: data.eye_tracking,
            phoneDetection: data.phone_detection,
            voiceDetection: data.voice_detection,
            multiFaceDetection: data.multi_face_detection,
            tabLockout: data.tab_lockout,
            sensitivity: data.sensitivity,
            allowedViolations: data.allowed_violations,
            warningsBeforeSubmit: data.warnings_before_submit
          }));
          if (data.updated_at) {
            setLastSavedTime(new Date(data.updated_at).toLocaleTimeString());
          }
        }
      } catch (err) {
        console.warn('Could not fetch persistent AI settings from DB, using cached state:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, [setAiConfig]);

  // Persist single or batch changes to database
  const saveToBackend = async (updated: AISettingsConfig, changeDesc: string) => {
    setSaveStatus('saving');
    try {
      const persisted = await adminApi.updateAISettings(updated);
      setSettings(persisted);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString());
      addAuditLog(changeDesc);

      // Sync with AppContext
      setAiConfig(prev => ({
        ...prev,
        faceDetection: persisted.face_detection,
        eyeTracking: persisted.eye_tracking,
        phoneDetection: persisted.phone_detection,
        voiceDetection: persisted.voice_detection,
        multiFaceDetection: persisted.multi_face_detection,
        tabLockout: persisted.tab_lockout,
        sensitivity: persisted.sensitivity,
        allowedViolations: persisted.allowed_violations,
        warningsBeforeSubmit: persisted.warnings_before_submit
      }));

      setTimeout(() => {
        setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
      }, 3000);
    } catch (err) {
      console.error('Failed to persist AI settings to DB:', err);
      setSaveStatus('error');
    }
  };

  const handleToggle = (key: keyof AISettingsConfig, label: string) => {
    const nextVal = !settings[key];
    const nextSettings = { ...settings, [key]: nextVal };
    setSettings(nextSettings);
    saveToBackend(nextSettings, `Toggled AI Setting: ${label} to ${nextVal ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleSensitivity = (level: 'Low' | 'Medium' | 'High') => {
    if (settings.sensitivity === level) return;
    const nextSettings = { ...settings, sensitivity: level };
    setSettings(nextSettings);
    saveToBackend(nextSettings, `Updated Proctoring Sensitivity threshold to ${level.toUpperCase()}`);
  };

  const handleViolationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 20) {
      const nextSettings = { ...settings, allowed_violations: val };
      setSettings(nextSettings);
      saveToBackend(nextSettings, `Changed Max Allowed Violations to ${val}`);
    }
  };

  const handleWarningsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 10) {
      const nextSettings = { ...settings, warnings_before_submit: val };
      setSettings(nextSettings);
      saveToBackend(nextSettings, `Changed Warnings Before Auto-Submit to ${val}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            AI Proctoring Configurations
            <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              DB Persistent
            </span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Configure global computer vision sensitivity thresholds, sensor arrays, and auto-lockout policies stored in PostgreSQL.
          </p>
        </div>

        {/* Persistence Status Badge */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Saving to DB...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved to Database {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Database Sync Error</span>
            </div>
          )}
          {saveStatus === 'idle' && lastSavedTime && (
            <div className="text-xs text-slate-400 font-semibold px-3 py-1 bg-slate-100 rounded-lg">
              DB Synced: {lastSavedTime}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Loading persistent configurations from PostgreSQL...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Proctor Sensor Array Sensitivity */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Proctor Sensor Array Sensitivity
              </span>
              <span className="text-xs font-bold text-slate-400">Current: {settings.sensitivity}</span>
            </h3>

            {/* Sensitivity Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['Low', 'Medium', 'High'] as const).map((level) => {
                const isSelected = settings.sensitivity === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSensitivity(level)}
                    className={`py-4 px-5 rounded-2xl font-bold border transition-all text-xs flex flex-col items-center gap-2 ${
                      isSelected 
                        ? 'bg-indigo-600/5 border-indigo-600 text-indigo-700 shadow-md shadow-indigo-600/10 ring-2 ring-indigo-600/20' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{level} Sensitivity</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 text-center">
                      {level === 'Low' && 'High tolerance for lighting & minor head turns'}
                      {level === 'Medium' && 'Standard university exam proctoring baseline'}
                      {level === 'High' && 'Strict zero-tolerance lockout rules & instant alerts'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Modules Toggles */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              Active Computer Vision & Acoustic Modules
            </h3>

            <div className="space-y-3.5">
              {/* Face Detection */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Biometric Face Signature Track</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Identifies student facial structure and flags missing candidates.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleToggle('face_detection', 'Biometric Face Track')}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    settings.face_detection ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.face_detection ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Eye Tracking */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Eye Gaze Vector Analysis</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Flags instances where eyes deviate from the browser screen area.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleToggle('eye_tracking', 'Eye Gaze Vector')}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    settings.eye_tracking ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.eye_tracking ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Multiple Faces Detection */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Multiple Faces & Impersonation Filter</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Detects secondary individuals entering the camera frame.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleToggle('multi_face_detection', 'Multiple Faces Filter')}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    settings.multi_face_detection ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.multi_face_detection ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Phone Detection */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Optical Object Classifiers (Mobile Devices & Textbooks)</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Flags secondary electronic devices or physical contraband in sight.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleToggle('phone_detection', 'Optical Phone Classifier')}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    settings.phone_detection ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.phone_detection ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Voice & Acoustic Detection */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Acoustic Audio Feed & Speech Classifier</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Flags conversational whispers and ambient speech during active testing.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleToggle('voice_detection', 'Speech Classifier')}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    settings.voice_detection ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.voice_detection ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Tab Switch & Fullscreen Lockout */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Tab Switch Lockout Sandbox</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Enforces lockdown environment and alerts faculty when windows blur.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleToggle('tab_lockout', 'Tab Lockout Sandbox')}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    settings.tab_lockout ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.tab_lockout ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Threshold Policies & Violation Limits */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Lockout Thresholds & Violation Limits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Violations */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">Allowed Violations Limit</label>
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-mono font-bold rounded-lg">
                    {settings.allowed_violations} incidents
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Maximum proctoring incident events before candidate integrity score drops into critical suspension threshold.
                </p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={settings.allowed_violations}
                  onChange={handleViolationsChange}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Warnings Before Submit */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">Warnings Before Auto-Submit</label>
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-mono font-bold rounded-lg">
                    {settings.warnings_before_submit} warnings
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Number of modal warning alerts shown to student before the exam attempt is locked and submitted automatically.
                </p>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={settings.warnings_before_submit}
                  onChange={handleWarningsChange}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISettings;
