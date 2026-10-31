import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { FeedbackMessage } from './use-feedback';

interface FeedbackBannerProps {
  message: FeedbackMessage;
  onDismiss: () => void;
}

export function FeedbackBanner({ message, onDismiss }: FeedbackBannerProps) {
  const isSuccess = message.type === 'success';

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
      className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          : 'bg-rose-50 text-rose-800 border border-rose-200'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
      )}
      <span className="flex-1">{message.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="shrink-0 rounded-md p-1 text-current/70 hover:bg-black/5 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
