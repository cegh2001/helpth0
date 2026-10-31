'use client';

import { AlertTriangle, X } from 'lucide-react';
import type { ImportRowError } from './use-import-flow';

interface ImportRowErrorsProps {
  errors: ImportRowError[];
  onDismiss: () => void;
}

const VISIBLE_LIMIT = 5;

/**
 * Shows the rows the parser or the repository rejected.
 *
 * The API has always answered with `errors: [{ rowNumber, message }]` and no
 * client read it, so a 90-row file could import 87 rows with no explanation.
 */
export function ImportRowErrors({ errors, onDismiss }: ImportRowErrorsProps) {
  if (errors.length === 0) return null;

  const visible = errors.slice(0, VISIBLE_LIMIT);
  const hiddenCount = errors.length - visible.length;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="flex-1 space-y-1.5">
          <p className="font-semibold">
            {errors.length === 1
              ? '1 fila no se pudo procesar'
              : `${errors.length} filas no se pudieron procesar`}
          </p>
          <ul className="space-y-1">
            {visible.map((error, index) => (
              <li key={`${error.rowNumber}-${index}`}>
                <span className="font-medium">Fila {error.rowNumber}:</span> {error.message}
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <p className="font-medium text-amber-700">y {hiddenCount} más…</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ocultar filas con problemas"
          className="shrink-0 cursor-pointer rounded-md p-1 text-current/70 hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
