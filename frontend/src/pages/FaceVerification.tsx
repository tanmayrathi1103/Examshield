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
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Face Verification</h1>
        <p className="text-sm text-slate-500">
          {examId ? (
            <>Proctoring identity check for: <span className="font-bold text-indigo-600">{exam?.title || 'Active Examination'}</span></>
          ) : (
            <>General-purpose biometric identity check</>
          )}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col items-center relative overflow-hidden">
        {!faceVerified ? (
          <div className="w-full flex flex-col items-center space-y-6">
            
            {/* Error Notification with Retries Count */}
            <AnimatePresence>
              {(error || cameraError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-md p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p>{error || cameraError}</p>
                    <div className="flex items-center justify-between text-[11px] text-rose-600 font-bold pt-1 border-t border-rose-200/60">
                      <span>Attempts remaining: {retriesLeft} of 5</span>
                      {similarityScore !== null && (
                        <span>Match score: {(similarityScore * 100).toFixed(1)}% (Threshold: 60%)</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Circular Camera Preview Frame */}
            <div className="relative w-80 h-80 rounded-full border-4 border-dashed border-indigo-600/40 p-2 flex items-center justify-center bg-slate-900 overflow-hidden shadow-2xl shadow-indigo-600/10">
              <div className="absolute inset-4 rounded-full border-2 border-indigo-400 flex items-center justify-center overflow-hidden bg-black">
                {/* Live Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${!cameraActive ? 'hidden' : ''}`}
                />

                {/* Laser Scanning Animation */}
                {cameraActive && (
                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan absolute top-0 z-10 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}

                {/* Camera Inactive State */}
                {!cameraActive && (
                  <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-center">
                    <Camera className="w-10 h-10 text-slate-500 animate-pulse" />
                    <span className="text-xs font-semibold">Starting camera feed...</span>
                  </div>
                )}

                {/* Verifying Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white z-20 p-4 text-center">
                    <Loader2 className="w-9 h-9 animate-spin text-indigo-400" />
                    <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Verifying Biometrics</p>
                    <p className="text-[11px] text-slate-400">Comparing cosine similarity...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction Prompt */}
            <div className="text-center max-w-sm space-y-1">
              <h3 className="font-bold text-slate-800 text-sm flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Position Face in Center
              </h3>
              <p className="text-xs text-slate-400">
                Hold your head steady inside the circle and face the camera directly with good lighting.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-md space-y-3">
              <button
                onClick={handleVerify}
                disabled={isLoading || !cameraActive}
                className={`w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 ${
                  isLoading || !cameraActive ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Comparing Facenet Embeddings...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Start Scan & Verify Face
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Protected by AES-256 encrypted biometric template</span>
              </div>
            </div>

          </div>
        ) : (
          /* Step 2: Verification Successful */
          <div className="w-full flex flex-col items-center py-6 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-2xl font-extrabold text-slate-800">Biometric Verification Successful</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI facial recognition has verified your live identity against your registered biometric template.
              </p>
            </div>

            {similarityScore !== null && (
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold">
                <span>Identity Match Confidence:</span>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-lg">
                  {(similarityScore * 100).toFixed(1)}% Match
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
              <button
                onClick={() => {
                  setFaceVerified(false);
                  startCamera();
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-verify
              </button>
              {examId ? (
                <button
                  onClick={handleStartExam}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Initialize Exam Environment
                </button>
              ) : (
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceVerification;
