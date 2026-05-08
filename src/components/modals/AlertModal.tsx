import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  confirmText = 'Entendi'
}: AlertModalProps) {
  const icons = {
    success: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
    error: <XCircle className="w-12 h-12 text-red-500" />,
    warning: <AlertCircle className="w-12 h-12 text-amber-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />
  };

  const colors = {
    success: 'bg-emerald-50',
    error: 'bg-red-50',
    warning: 'bg-amber-50',
    info: 'bg-blue-50'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            {/* Top Pattern/Decoration */}
            <div className={cn("h-32 flex items-center justify-center relative", colors[type])}>
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="currentColor" />
                </svg>
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                className="relative z-10 bg-white p-4 rounded-full shadow-lg"
              >
                {icons[type]}
              </motion.div>
              
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 pb-10 text-center">
              <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
                {title}
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                {message}
              </p>

              <button
                onClick={onClose}
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg",
                  type === 'success' && "bg-[#006747] text-white shadow-emerald-900/20",
                  type === 'error' && "bg-red-500 text-white shadow-red-900/20",
                  type === 'warning' && "bg-amber-500 text-white shadow-amber-900/20",
                  type === 'info' && "bg-blue-600 text-white shadow-blue-900/20"
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
