import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export interface ErrorCopy {
  title: string;
  description?: string;
}

export interface NotifyOptions {
  description?: string;
  action?: { label: string; onClick: () => void };
  /** Stable id so a repeated failure replaces its toast instead of stacking. */
  id?: string;
}

const SERVER_ERROR_TITLE = 'Error del servidor';
const OFFLINE_TITLE = 'Sin conexión';

/**
 * Turns any thrown value into copy a person can act on.
 *
 * Order matters: `ApiError` is the only error we can explain precisely, and a
 * network drop arrives as `TypeError('Failed to fetch')`, which would otherwise
 * leak a technical message into the UI.
 */
export function describeError(error: unknown, fallbackTitle: string): ErrorCopy {
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      return {
        title: SERVER_ERROR_TITLE,
        description: 'No se pudo completar la operación. Intentá de nuevo en unos segundos.',
      };
    }
    return { title: error.message };
  }

  if (error instanceof TypeError) {
    return { title: OFFLINE_TITLE, description: 'Revisá tu conexión e intentá de nuevo.' };
  }

  if (error instanceof Error && error.message.trim()) {
    return { title: error.message };
  }

  // Local validation rules must not reach the toast as [object Object] or as a
  // generic fallback: the message itself is the whole point.
  if (typeof error === 'string' && error.trim()) {
    return { title: error };
  }

  return { title: fallbackTitle };
}

export function describeErrorText(error: unknown, fallbackTitle: string): string {
  const copy = describeError(error, fallbackTitle);
  return copy.description ? `${copy.title}. ${copy.description}` : copy.title;
}

export function notifyError(
  error: unknown,
  fallbackTitle: string,
  options: NotifyOptions = {}
): ErrorCopy {
  const copy = describeError(error, fallbackTitle);
  toast.error(copy.title, {
    id: options.id,
    description: options.description ?? copy.description,
    duration: 8000,
    action: options.action,
  });
  return copy;
}

export function notifySuccess(title: string, options: NotifyOptions = {}): void {
  toast.success(title, {
    id: options.id,
    description: options.description,
    action: options.action,
  });
}

export function notifyWarning(title: string, options: NotifyOptions = {}): void {
  toast.warning(title, {
    id: options.id,
    description: options.description,
    duration: 9000,
    action: options.action,
  });
}
