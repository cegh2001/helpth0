'use client';

import { AlertCircle, X } from 'lucide-react';

interface ImportErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Persistent companion to the toast for import failures.
 *
 * The toast is what the user sees while scrolled anywhere in the review table;
 * this strip is what stays on screen, next to the action, until it is resolved.
 */
export function ImportErrorAlert({ message, onDismiss }: ImportErrorAlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800"
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="shrink-0 cursor-pointer rounded-md p-1 text-current/70 hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
