import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useBiometrics } from '../hooks/useBiometrics';
import { Camera, Check, ShieldCheck, Loader2, AlertCircle, Trash2, RefreshCw, Lock, Sparkles, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FaceRegistration: React.FC = () => {
  const { setFaceRegistered } = useApp();
  const navigate = useNavigate();
  const {
    videoRef,
    cameraActive,
    cameraError,
    isLoading,
    error,
    setError,
    enrollmentStatus,
    startCamera,
    stopCamera,
    registerFace,
    fetchStatus,
    deleteBiometrics
  } = useBiometrics();

  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: camera/register, 2: success
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  useEffect(() => {
    fetchStatus().then((status) => {
      if (status?.is_registered) {
        setFaceRegistered(true);
        setQualityScore(status.quality_score || 92);
      }
    });
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const handleCaptureAndRegister = async (override: boolean = false) => {
    if (!consent) {
      setError('Please provide explicit biometric consent before enrolling.');
      return;
    }

    try {
      const res = await registerFace(consent, override);
      setQualityScore(res.quality_score);
      setFaceRegistered(true);
      setStep(2);
      setShowOverrideModal(false);
    } catch (err: any) {
      if (err.message?.includes('does not match existing biometrics') || err.message?.includes('already registered')) {
        setShowOverrideModal(true);
      }
    }
  };

  const handleDeleteData = async () => {
    if (window.confirm('Are you sure you want to erase your registered biometric signature? You will need to re-register before taking proctored exams.')) {
      try {
        await deleteBiometrics();
        setFaceRegistered(false);
        setStep(1);
        startCamera();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[80vh] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 relative overflow-hidden flex flex-col items-center">
        
        {/* Subtle Background Accent */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col items-center">
          
          {/* Header Typography */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Biometric Registration
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Generate your secure facial signature.
              </p>
            </div>
            
            {enrollmentStatus?.is_registered && step === 1 && (
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wider font-bold rounded-full border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enrolled
                </div>
                <button
                  onClick={handleDeleteData}
                  disabled={isLoading}
                  title="Right to Erasure"
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-full text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 border border-rose-100 shrink-0"
                >
                  <Trash2 className="w-3 h-3" /> Erase Data
                </button>
              </div>
            )}
          </div>

          <div className="w-full flex flex-col items-center justify-center">
            
            {step === 1 ? (
              <div className="w-full flex flex-col items-center space-y-4">
                
                {/* Error Message Notification */}
                <AnimatePresence>
                  {(error || cameraError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      className="w-full max-w-sm p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm font-medium"
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="text-xs">{error || cameraError}</p>
                        <p className="text-[9px] text-rose-600/80 font-bold uppercase tracking-wider pt-1.5 border-t border-rose-100/50">
                          Sit directly in front of light & center face
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Clean Circular Camera Frame */}
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full p-1.5 bg-slate-50 border border-slate-100 shadow-inner">
                  <div className="relative w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center ring-1 ring-black/5 shadow-2xl">
                    {/* Background Grid Pattern (Always visible in dark circle) */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '12px 12px' }} />

                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-700 z-10 ${!cameraActive ? 'opacity-0' : 'opacity-100'}`}
                    />

                    {/* Scanning Laser Line Overlay */}
                    {cameraActive && !isLoading && (
                      <div className="absolute left-0 right-0 h-1 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-20 animate-[scan_3s_ease-in-out_infinite]" />
                    )}

                    {/* Sleek Minimalist Scanning Ring */}
                    {cameraActive && (
                      <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/30 shadow-[inset_0_0_25px_rgba(99,102,241,0.3)] z-20" />
                    )}

                    {/* Loading / Camera placeholder */}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center z-10">
                        <Camera className="w-8 h-8 text-indigo-400/80 animate-pulse" strokeWidth={1.5} />
                        <span className="text-xs font-black tracking-[0.2em] uppercase text-indigo-200/90 animate-pulse drop-shadow-md">Initializing</span>
                      </div>
                    )}

                    {/* Processing Overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white z-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest animate-pulse">Analyzing</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alignment Guide Instructions */}
                <div className="text-center max-w-xs space-y-0.5 mt-2">
                  <h3 className="font-semibold text-slate-800 text-[13px]">
                    Position your face in the center
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    System verifies blur, exposure & alignment.
                  </p>
                </div>

                {/* Explicit GDPR Consent Checkbox */}
                <div className="w-full max-w-sm p-2.5 bg-slate-50 border border-slate-100 rounded-xl mt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        setError(null);
                      }}
                      className="mt-0.5 w-3.5 h-3.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 accent-slate-900 transition-all"
                    />
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                        <Lock className="w-3 h-3 text-slate-500" /> Biometric Consent
                      </span>
                      <p className="text-[9.5px] text-slate-500 leading-tight">
                        Encrypted storage (AES-256) of facial signature solely for proctoring. Raw video is discarded instantly.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="w-full max-w-sm pt-2">
                  <button
                    onClick={() => handleCaptureAndRegister(false)}
                    disabled={isLoading || !cameraActive || !consent}
                    className={`group relative w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 ${
                      isLoading || !cameraActive || !consent ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registering Profile...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        Capture & Register Face
                      </>
                    )}
                  </button>
                </div>

                {/* Re-registration Confirmation Modal */}
                {showOverrideModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl space-y-5 border border-slate-100">
                      <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 text-slate-800 flex items-center justify-center mx-auto shadow-inner">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Overwrite Biometrics?</h3>
                        <p className="text-sm text-slate-500 font-medium">
                          You already have an active profile. Continuing will archive the previous signature.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 pt-4">
                        <button
                          onClick={() => handleCaptureAndRegister(true)}
                          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                        >
                          Confirm Overwrite
                        </button>
                        <button
                          onClick={() => setShowOverrideModal(false)}
                          className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Step 2: Success Confirmation */
              <div className="w-full flex flex-col items-center py-6 space-y-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner border border-emerald-100">
                  <ShieldCheck className="w-10 h-10 animate-bounce" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Biometrics Registered</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-sm">
                    Your facial embedding is fully encrypted and securely linked to your ID.
                  </p>
                </div>

                {qualityScore && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                    <span>Capture Quality:</span>
                    <span className="text-emerald-600 font-bold">
                      {qualityScore}% Optimal
                    </span>
                  </div>
                )}

                <div className="flex flex-col w-full max-w-sm gap-2.5 pt-4">
                  <button
                    onClick={() => navigate('/student/dashboard')}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setStep(1);
                      startCamera();
                    }}
                    className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-take Capture
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
