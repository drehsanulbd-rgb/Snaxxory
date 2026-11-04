/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
      {toasts.map(toast => {
        let bg = 'bg-stone-900 border-stone-800 text-stone-100';
        let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-stone-900 dark:bg-stone-900 border-emerald-600/50 text-stone-100';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-stone-900 dark:bg-stone-900 border-red-600/50 text-stone-100';
          icon = <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-stone-900 dark:bg-stone-900 border-amber-600/50 text-stone-100';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${bg}`}
          >
            {icon}
            <span className="text-sm font-medium leading-snug">{toast.text}</span>
          </div>
        );
      })}
    </div>
  );
};
