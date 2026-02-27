import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'تأیید', danger = true }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <h3 className="text-lg font-bold text-navy-800">{title}</h3>
            </div>
            <p className="text-navy-600 mb-6 text-sm leading-relaxed">{message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-navy-600 hover:bg-navy-100 transition-colors">
                انصراف
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-5 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-navy-700 hover:bg-navy-800'}`}
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
