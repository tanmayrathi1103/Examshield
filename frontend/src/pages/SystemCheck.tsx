import React from 'react';
import { useApp } from '../context/AppContext';
import { Camera, Mic, Wifi, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SystemCheck: React.FC = () => {
  const {
    isCamOn, setIsCamOn,
    isMicOn, setIsMicOn,
    isInternetStable, setIsInternetStable,
    isBrowserSecure, setIsBrowserSecure,
    faceRegistered
  } = useApp();
  const navigate = useNavigate();

  const allPassed = isCamOn && isMicOn && isInternetStable && isBrowserSecure;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Proctoring System Check</h1>
        <p className="text-slate-500">Configure and verify your hardware parameters to guarantee proctoring compatibility.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Banner Status */}
        <div className={`p-6 text-white flex items-center justify-between ${allPassed ? 'bg-indigo-600' : 'bg-amber-500'}`}>
          <div>
            <div className="font-extrabold text-lg">
              {allPassed ? 'System Configuration Certified' : 'System Configuration Incomplete'}
            </div>
            <div className="text-xs text-indigo-100/90 mt-1">
              {allPassed ? 'All proctoring nodes are functioning optimally.' : 'Please toggle inputs to green status to pass checks.'}
            </div>
          </div>
          {allPassed ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>

        {/* Action Check Cards */}
        <div className="p-8 space-y-6">
          {/* Camera Check */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCamOn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Video Acquisition Node</h3>
                <p className="text-xs text-slate-400 mt-0.5">Detects webcam inputs and feeds visual data to AI.</p>
              </div>
            </div>
            <button
              onClick={() => setIsCamOn(!isCamOn)}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${isCamOn
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
            >
              {isCamOn ? 'ON / Certified' : 'Toggle ON'}
            </button>
          </div>

          {/* Mic Check */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isMicOn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Acoustic Signal Monitor</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ensures microphone tracks voice deviations.</p>
              </div>
            </div>
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${isMicOn
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
            >
              {isMicOn ? 'ON / Certified' : 'Toggle ON'}
            </button>
          </div>

          {/* Network Check */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isInternetStable ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Internet Latency Node</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sustained connection is critical to push live metrics.</p>
              </div>
            </div>
            <button
              onClick={() => setIsInternetStable(!isInternetStable)}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${isInternetStable
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
            >
              {isInternetStable ? 'Stable' : 'Disconnect'}
            </button>
          </div>

          {/* Browser Lock Check */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isBrowserSecure ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Secure Browser Sandbox</h3>
                <p className="text-xs text-slate-400 mt-0.5">Verifies integrity of fullscreen sandbox.</p>
              </div>
            </div>
            <button
              onClick={() => setIsBrowserSecure(!isBrowserSecure)}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${isBrowserSecure
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
            >
              {isBrowserSecure ? 'Secure' : 'Insecure'}
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() => {
              if (allPassed) {
                if (!faceRegistered) navigate('/student/face-registration');
                else navigate('/student/dashboard');
              }
            }}
            disabled={!allPassed}
            className={`px-6 py-3 font-extrabold text-sm rounded-xl transition-all ${allPassed
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            Proceed to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemCheck;
