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
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Biometric Registration</h1>
          <p className="text-sm text-slate-500">
            Generate and encrypt your 128-dimensional facial signature for secure exam proctoring.
          </p>
        </div>
        {enrollmentStatus?.is_registered && step === 1 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Currently Enrolled
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col items-center relative overflow-hidden">
        {step === 1 ? (
          <div className="w-full flex flex-col items-center space-y-6">
            
            {/* Error Message Notification */}
            <AnimatePresence>
              {(error || cameraError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-md p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{error || cameraError}</p>
                    <p className="text-[11px] text-rose-500 font-normal mt-0.5">
                      Tip: Sit directly in front of light, remove hats or thick glasses, and keep face centered.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Circular Camera Preview Frame */}
            <div className="relative w-80 h-80 rounded-full border-4 border-dashed border-indigo-600/40 p-2 flex items-center justify-center bg-slate-900 overflow-hidden shadow-2xl shadow-indigo-600/10">
              <div className="absolute inset-4 rounded-full border-2 border-indigo-400 flex items-center justify-center overflow-hidden bg-black">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${!cameraActive ? 'hidden' : ''}`}
                />

                {/* Animated Scanner Laser */}
                {cameraActive && (
                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan absolute top-0 z-10 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}

                {/* Loading / Camera placeholder */}
                {!cameraActive && (
                  <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-center">
                    <Camera className="w-10 h-10 text-slate-500 animate-pulse" />
                    <span className="text-xs font-semibold">Starting camera feed...</span>
                  </div>
                )}

                {/* Processing Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white z-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Analyzing Face Profile</p>
                      <p className="text-[10px] text-slate-400">Verifying quality checks...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alignment Guide Instructions */}
            <div className="text-center max-w-md space-y-1">
              <h3 className="font-bold text-slate-800 text-sm flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Position Face in Center
              </h3>
              <p className="text-xs text-slate-500">
                Look straight ahead. The system will verify blur, exposure, and face alignment on capture.
              </p>
            </div>

            {/* Explicit GDPR Consent Checkbox */}
            <div className="w-full max-w-md p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setError(null);
                  }}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-600 disabled:opacity-50"
                />
                <div className="text-xs text-slate-600 space-y-0.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" /> Biometric Consent (GDPR Compliant)
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    I consent to the capture, cryptographic encryption (AES-256), and storage of my raw facial image solely for online exam identity verification. Raw video is never stored unencrypted.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <button
                onClick={() => handleCaptureAndRegister(false)}
                disabled={isLoading || !cameraActive || !consent}
                className={`w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 ${
                  isLoading || !cameraActive || !consent ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering Face Profile...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Capture & Register Face
                  </>
                )}
              </button>

              {enrollmentStatus?.is_registered && (
                <button
                  onClick={handleDeleteData}
                  disabled={isLoading}
                  title="Right to Erasure"
                  className="px-4 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl text-xs transition-colors flex items-center gap-1.5 border border-rose-200 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Erase Data
                </button>
              )}
            </div>

            {/* Re-registration Confirmation Modal */}
            {showOverrideModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800">Confirm Biometric Re-registration</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      You already have an enrolled biometric signature. Overwriting will archive the previous template while preserving an audit log.
                    </p>
                  </div>
                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setShowOverrideModal(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCaptureAndRegister(true)}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/20"
                    >
                      Confirm Overwrite
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Step 2: Success Confirmation */
          <div className="w-full flex flex-col items-center py-8 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-10 h-10 animate-bounce" />
            </div>

            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-2xl font-extrabold text-slate-800">Biometrics Registered!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your 128-dimensional facial embedding is encrypted with AES-256 and securely linked to your student ID.
              </p>
            </div>

            {qualityScore && (
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
                <span>Capture Quality Score:</span>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-lg">
                  {qualityScore}% Optimal
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setStep(1);
                  resetLiveness();
                  startCamera();
                }}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-take Capture
              </button>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/20"
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
