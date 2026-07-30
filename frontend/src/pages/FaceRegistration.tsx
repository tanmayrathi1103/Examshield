import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const FaceRegistration: React.FC = () => {
  const { faceRegistered, setFaceRegistered } = useApp();
  const [registering, setRegistering] = useState(false);
  const [step, setStep] = useState(1); // 1: pre-register, 2: registered
  const navigate = useNavigate();

  const handleRegister = () => {
    setRegistering(true);
    setTimeout(() => {
      setRegistering(false);
      setFaceRegistered(true);
      setStep(2);
    }, 2500); // Simulated processing duration
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Biometric Registration</h1>
        <p className="text-slate-500">Record your facial coordinates into the secure local database for authentication.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col items-center">
        {step === 1 ? (
          <div className="w-full flex flex-col items-center space-y-6">
            {/* Camera Preview Frame */}
            <div className="relative w-80 h-80 rounded-full border-4 border-dashed border-indigo-600/40 p-2 flex items-center justify-center bg-slate-50 overflow-hidden">
              <div className="absolute inset-4 rounded-full border-2 border-indigo-500/80 flex items-center justify-center">
                {/* Simulated webcam scan lines */}
                <div className="w-full h-[2px] bg-indigo-500 animate-scan absolute top-0" />
                
                {registering ? (
                  <div className="flex flex-col items-center gap-2 text-indigo-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider">Analyzing Nodes...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Camera className="w-10 h-10" />
                    <span className="text-xs font-semibold">Position face in center</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center max-w-sm space-y-2">
              <h3 className="font-bold text-slate-800">Align Your Face</h3>
              <p className="text-xs text-slate-400">Ensure good lighting, look straight into the camera, and remove accessories like sunglasses or large headphones.</p>
            </div>

            <button 
              onClick={handleRegister}
              disabled={registering}
              className={`px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-2 ${
                registering ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
              }`}
            >
              {registering ? 'Capturing...' : 'Capture & Register Biometrics'}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center py-8 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-10 h-10 animate-bounce" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-slate-800">Biometrics Registered Successfully!</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Your 3D facial signature is encrypted and saved. You can now access all scheduled online proctored examinations.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 rounded-xl text-xs transition-colors"
              >
                Re-register Face
              </button>
              <button 
                onClick={() => navigate('/student/dashboard')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRegistration;
