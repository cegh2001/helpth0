'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  title: string;
  description: string;
  /** Server errors are anonymised in production; the digest links them to the logs. */
  digest?: string;
  onRetry: () => void;
  secondary?: ReactNode;
}

/**
 * Shared fallback for the route error boundaries.
 *
 * Errors forwarded from a Server Component arrive with a generic message on
 * purpose, so showing `error.message` would be useless at best and a leak at
 * worst. The digest is the only piece worth keeping: it is what matches the
 * server log line.
 */
export function ErrorFallback({
  title,
  description,
  digest,
  onRetry,
  secondary,
}: ErrorFallbackProps) {
  return (
    <div role="alert" className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle className="h-6 w-6 text-rose-600" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-base font-bold text-slate-900">{title}</h1>
          <p className="text-xs leading-relaxed text-slate-500">{description}</p>
        </div>

        {digest && (
          <p className="font-mono text-[11px] text-slate-400">Código de referencia: {digest}</p>
        )}

        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={onRetry}
            className="w-full cursor-pointer rounded-xl sm:w-auto"
          >
            <RotateCcw aria-hidden="true" />
            Reintentar
          </Button>
          {secondary}
        </div>
      </div>
    </div>
  );
}
