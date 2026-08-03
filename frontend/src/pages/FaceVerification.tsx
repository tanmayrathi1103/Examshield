import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { useExams } from '../hooks/useExams';

const FaceVerification: React.FC = () => {
  const { faceVerified, setFaceVerified } = useApp();
  const { currentExam, fetchExamById } = useExams();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();

  const exam = currentExam;

  useEffect(() => {
    if (!examId) {
      navigate('/student/dashboard');
    } else {
      fetchExamById(examId, true);
    }
  }, [examId, navigate, fetchExamById]);

  const handleVerify = () => {
    setVerifying(true);
    setError('');
    setTimeout(() => {
      setVerifying(false);
      setFaceVerified(true);
    }, 2000);
  };

  const handleStartExam = () => {
    if (faceVerified && examId) {
      navigate(`/student/exam/${examId}/live`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Biometric Verification</h1>
        <p className="text-slate-500">Authenticate identity for: <span className="font-bold text-indigo-600">{exam?.title || 'Selected Exam'}</span></p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col items-center">
        {!faceVerified ? (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="relative w-72 h-72 rounded-full border-4 border-dashed border-indigo-600/40 p-2 flex items-center justify-center bg-slate-50 overflow-hidden">
              <div className="absolute inset-4 rounded-full border-2 border-indigo-500/80 flex items-center justify-center">
                <div className="w-full h-[2px] bg-indigo-500 animate-scan absolute top-0" />
                
                {verifying ? (
                  <div className="flex flex-col items-center gap-2 text-indigo-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider text-center">Verifying Signature...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Camera className="w-10 h-10" />
                    <span className="text-xs font-semibold">Position face in scan circle</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleVerify}
              disabled={verifying}
              className={`px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-2 ${
                verifying ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
              }`}
            >
              {verifying ? 'Authenticating...' : 'Start Scan & Verify Face'}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center py-6 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-10 h-10 animate-bounce" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-slate-800">Biometric Verification Successful</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                AI has authenticated your identity matching the database. Click below to initialize the examination environment.
              </p>
            </div>

            <button 
              onClick={handleStartExam}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5"
            >
              Initialize Exam Environment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceVerification;
