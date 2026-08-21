import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireTypedConfirmation?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  requireTypedConfirmation,
  isLoading = false,
}) => {
  const [typedText, setTypedText] = useState('');

  if (!isOpen) return null;

  const isConfirmDisabled = requireTypedConfirmation 
    ? typedText !== requireTypedConfirmation 
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={() => !isLoading && onCancel()}
      />
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>
          </div>
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-slate-600 text-sm leading-relaxed">
            {message}
          </div>

          {requireTypedConfirmation && (
            <div className="space-y-2 mt-4">
              <label className="text-xs font-bold text-slate-700 block">
                Type <span className="text-slate-900 select-all font-mono bg-slate-100 px-1 py-0.5 rounded">{requireTypedConfirmation}</span> to confirm.
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
                placeholder="Type here..."
                disabled={isLoading}
              />
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <Button 
            variant="ghost" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm}
            disabled={isConfirmDisabled || isLoading}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
