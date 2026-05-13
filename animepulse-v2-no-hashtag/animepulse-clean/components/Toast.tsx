'use client';
/**
 * components/Toast.tsx
 * Lightweight toast notification system — no external dependencies.
 * Usage: import { toast } from '@/components/Toast'
 *        toast.success('Done!') / toast.error('Oops!') / toast.info('FYI')
 */

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  dying: boolean;
}

// Global event emitter
const listeners: Array<(item: Omit<ToastItem, 'dying'>) => void> = [];

function emit(item: Omit<ToastItem, 'dying'>) {
  listeners.forEach(fn => fn(item));
}

export const toast = {
  success: (message: string) => emit({ id: crypto.randomUUID(), message, type: 'success' }),
  error:   (message: string) => emit({ id: crypto.randomUUID(), message, type: 'error' }),
  info:    (message: string) => emit({ id: crypto.randomUUID(), message, type: 'info' }),
};

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
};

const COLORS: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-700',
  error:   'border-red-200 bg-red-50 text-red-600',
  info:    'border-orange-200 bg-orange-50 text-[#e85d04]',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, dying: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  useEffect(() => {
    const handler = (item: Omit<ToastItem, 'dying'>) => {
      setToasts(prev => [...prev.slice(-4), { ...item, dying: false }]);
      setTimeout(() => remove(item.id), 3500);
    };
    listeners.push(handler);
    return () => { const idx = listeners.indexOf(handler); if (idx > -1) listeners.splice(idx, 1); };
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3
              rounded-xl border backdrop-blur-xl shadow-2xl
              min-w-[220px] max-w-[340px] text-sm font-medium
              ${COLORS[t.type]}
              ${t.dying
                ? 'animate-toast-out' : 'animate-toast-in'}
            `}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-white">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
