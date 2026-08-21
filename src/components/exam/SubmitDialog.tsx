import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  totalCount: number;
}

export const SubmitDialog: React.FC<SubmitDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  totalCount
}) => {
  if (!isOpen) return null;

  const allAnswered = answeredCount === totalCount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-full ${allAnswered ? 'bg-green-100' : 'bg-amber-100'}`}>
                <AlertTriangle className={`h-6 w-6 ${allAnswered ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Examination?</h2>
            
            <p className="text-gray-600 mb-6">
              You have answered <span className="font-bold text-gray-900">{answeredCount}</span> out of <span className="font-bold text-gray-900">{totalCount}</span> questions.
              {!allAnswered && " Please review the unanswered questions before submitting."}
            </p>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
              <p className="text-sm text-gray-700 font-medium">
                Once submitted, you will not be able to change your answers. This action is final.
              </p>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
