import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: {
    bg: 'bg-[#10B981]/10 border-[#10B981]/30',
    icon: 'text-[#10B981]',
    text: 'text-[#065F46] dark:text-[#A7F3D0]',
  },
  error: {
    bg: 'bg-[#ba1a1a]/10 border-[#ba1a1a]/30',
    icon: 'text-[#ba1a1a]',
    text: 'text-[#7F1D1D] dark:text-[#FECACA]',
  },
  warning: {
    bg: 'bg-[#F59E0B]/10 border-[#F59E0B]/30',
    icon: 'text-[#F59E0B]',
    text: 'text-[#92400E] dark:text-[#FDE68A]',
  },
  info: {
    bg: 'bg-[#4338ca]/10 border-[#4338ca]/30',
    icon: 'text-[#4338ca]',
    text: 'text-[#312E81] dark:text-[#C7D2FE]',
  },
};

let toastId = 0;

function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || ICONS.info;
  const colors = COLORS[toast.type] || COLORS.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg ${colors.bg} w-[360px]`}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${colors.icon}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{toast.title}</p>
        )}
        <p className={`text-sm ${colors.text} ${toast.title ? 'mt-0.5' : ''}`}>{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors ${colors.icon} opacity-60 hover:opacity-100 cursor-pointer`}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const notify = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const noop = () => {};
    return { toast: noop };
  }
  return { toast: ctx };
}
