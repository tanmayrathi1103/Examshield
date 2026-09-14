import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useBiometrics } from '../hooks/useBiometrics';
import { useExams } from '../hooks/useExams';
import { Camera, ShieldCheck, Loader2, AlertCircle, RefreshCw, Sparkles, CheckCircle2, Lock, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FaceVerification: React.FC = () => {
  const { faceVerified, setFaceVerified } = useApp();
  const { currentExam, fetchExamById } = useExams();
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const {
    videoRef,
    cameraActive,
    cameraError,
    isLoading,
    error,
    setError,
    retriesLeft,
    similarityScore,
    startCamera,
    stopCamera,
    verifyFace
  } = useBiometrics();

  useEffect(() => {
    if (examId) {
      fetchExamById(examId, true);
    }
  }, [examId, fetchExamById]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleVerify = async () => {
    setError(null);

    try {
      const response = await verifyFace(examId);
      if (response.verified) {
        setFaceVerified(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartExam = () => {
    if (faceVerified && examId) {
      navigate(`/student/exam/${examId}/live`);
    }
  };

  const exam = currentExam;

  return (
    <div className="w-full h-full min-h-[80vh] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 relative overflow-hidden flex flex-col items-center">
        
        {/* Subtle Background Accent */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col items-center">
          
          {/* Header Typography */}
          <div className="text-center mb-8 space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Identity Verification
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {exam?.title ? `Secure session: ${exam.title}` : 'AI Security Protocols Active'}
            </p>
          </div>

          <div className="w-full flex flex-col items-center justify-center">
            
            {!faceVerified ? (
              <div className="w-full flex flex-col items-center space-y-6">
                
                {/* Error Notifications */}
                <AnimatePresence>
                  {(error || cameraError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      className="w-full max-w-sm p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-medium"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="text-xs">{error || cameraError}</p>
                        <div className="flex items-center justify-between text-[10px] text-rose-600/80 font-bold uppercase tracking-wider pt-2 border-t border-rose-100/50">
                          <span>Attempts: {retriesLeft}/5</span>
                          {similarityScore !== null && (
                            <span>Score: {(similarityScore * 100).toFixed(1)}%</span>
                          )}
                        </div>
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

                    {/* Inactive State */}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center z-10">
                        <Camera className="w-8 h-8 text-indigo-400/80 animate-pulse" strokeWidth={1.5} />
                        <span className="text-xs font-black tracking-[0.2em] uppercase text-indigo-200/90 animate-pulse drop-shadow-md">Initializing</span>
                      </div>
                    )}

                    {/* Verifying Overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white z-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest animate-pulse">Scanning</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center max-w-xs space-y-1">
                  <h3 className="font-semibold text-slate-800 text-sm">
                    Position your face in the circle
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ensure clear lighting and face the camera directly.
                  </p>
                </div>

                {/* Action Button */}
                <div className="w-full max-w-sm pt-2">
                  <button
                    onClick={handleVerify}
                    disabled={isLoading || !cameraActive}
                    className={`group relative w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 ${
                      isLoading || !cameraActive ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-slate-400" /> Scan & Verify
                      </>
                    )}
                  </button>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    <Lock className="w-3 h-3" /> Secure Biometric Scan
                  </div>
                </div>

              </div>
            ) : (
              /* Verification Successful */
              <div className="w-full flex flex-col items-center py-6 space-y-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner border border-emerald-100">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Access Granted</h3>
                  <p className="text-sm text-slate-500 font-medium">
                    Your identity has been securely verified.
                  </p>
                </div>

                {similarityScore !== null && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                    <span>Match Confidence:</span>
                    <span className="text-emerald-600 font-bold">
                      {(similarityScore * 100).toFixed(1)}%
                    </span>
                  </div>
                )}

                <div className="flex flex-col w-full max-w-sm gap-2.5 pt-4">
                  {examId ? (
                    <button
                      onClick={handleStartExam}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Start Examination
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/student/dashboard')}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Enter Portal
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setFaceVerified(false);
                      startCamera();
                    }}
                    className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-verify Identity
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

export default FaceVerification;
