'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/errors/error-fallback';
import { Button } from '@/components/ui/button';

interface AppErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

/**
 * Boundary for the routes outside the dashboard (login and setup). They render
 * without the shell, so the only escape hatch worth offering is a full reload.
 */
export default function AppError({ error, retry }: AppErrorProps) {
  useEffect(() => {
    console.error('[app] render failed', { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <ErrorFallback
      title="Algo salió mal"
      description="No pudimos cargar esta pantalla. Reintentá y, si el problema persiste, recargá la página."
      digest={error.digest}
      onRetry={retry}
      secondary={
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full cursor-pointer rounded-xl sm:w-auto"
        >
          Recargar página
        </Button>
      }
    />
  );
}
