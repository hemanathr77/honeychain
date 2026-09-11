import React from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

const icons = {
  success: <CheckCircle size={18} className="text-forest-600" />,
  error: <XCircle size={18} className="text-red-600" />,
  warning: <AlertCircle size={18} className="text-yellow-600" />,
  info: <Info size={18} className="text-blue-600" />,
};

const colors = {
  success: 'border-l-forest-500',
  error: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500',
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts?.length) return null;
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`bg-white rounded-xl shadow-card-hover border border-cream-200 border-l-4 ${colors[toast.type] || colors.info} p-4 flex items-start gap-3 animate-slide-in-right`}
        >
          {icons[toast.type] || icons.info}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal-800">{toast.message}</p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-charcoal-400 hover:text-charcoal-600 flex-shrink-0 mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
