"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-100 flex flex-col gap-4 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              layout
              className="pointer-events-auto bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                {toast.type === 'info' && <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm uppercase tracking-wide wrap-break-word">{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 hover:bg-black hover:text-white transition-colors border-black border">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
