import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AlertCircle, ArrowRight, ShieldCheck, CheckSquare, Square } from 'lucide-react';

const Instructions: React.FC = () => {
  const { exams } = useApp();
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');

  const exam = exams.find(e => e.id === examId);

  useEffect(() => {
    if (!examId) {
      navigate('/student/dashboard');
    }
  }, [examId, navigate]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Examination Instructions</h1>
        <p className="text-slate-500">Please read proctoring rules carefully before proceeding.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="space-y-1 pb-4 border-b">
          <div className="text-xs font-bold text-indigo-600 uppercase">Assessment Details</div>
          <h2 className="text-xl font-extrabold text-slate-800">{exam?.title}</h2>
          <div className="flex gap-6 text-sm text-slate-400 mt-2 font-medium">
            <span>Duration: {exam?.duration} minutes</span>
            <span>Questions: {exam?.questionsCount} Items</span>
            <span>Total Score: {exam ? exam.questionsCount * 2 : 0} Points</span>
          </div>
        </div>

        {/* Proctoring Rules Box */}
        <div className="bg-slate-50 border rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            AI Proctoring & Compliance Guidelines
          </h3>
          
          <ul className="space-y-3 text-xs text-slate-600 font-semibold pl-2">
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">1.</span>
              <span>**Identity Monitoring**: Facial tracking is continuous. Leaving the camera field or a second person entering will flag a high-severity violation.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">2.</span>
              <span>**Gaze Tracking**: Looking away from the screen for prolonged periods will trigger eye deviation warnings.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">3.</span>
              <span>**Audio Environment**: The microphone tracks environmental noise. Speaking aloud or secondary human voices will trigger alarms.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">4.</span>
              <span>**Lockdown Sandbox**: Tab switching or exiting fullscreen mode is strictly blocked. Switching tabs will trigger auto-submission policies.</span>
            </li>
          </ul>
        </div>

        {/* Agreement checkbox */}
        <button 
          onClick={() => setAgreed(!agreed)}
          className="flex items-center gap-3 p-4 hover:bg-slate-50 w-full text-left rounded-xl transition-all border border-transparent hover:border-slate-200"
        >
          {agreed ? (
            <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0" />
          ) : (
            <Square className="w-6 h-6 text-slate-300 flex-shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-700">
            I confirm that my camera and microphone are certified, and I agree to follow the AI proctoring regulations during the assessment.
          </span>
        </button>

        {/* Proceed Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Cancel and Return
          </button>
          
          <button 
            onClick={() => {
              if (agreed && examId) {
                navigate(`/student/face-verification?examId=${examId}`);
              }
            }}
            disabled={!agreed}
            className={`px-6 py-3 text-sm font-extrabold rounded-xl flex items-center gap-2 transition-all ${
              agreed 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Agree and Proceed <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
