'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ErrorFallback } from '@/components/errors/error-fallback';
import { Button } from '@/components/ui/button';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

/**
 * Boundary for every module route. It renders inside the dashboard shell, so
 * the navigation stays usable while one module fails: the user can walk away
 * instead of being trapped on a dead page.
 */
export default function DashboardError({ error, retry }: DashboardErrorProps) {
  useEffect(() => {
    console.error('[dashboard] render failed', {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <ErrorFallback
      title="No pudimos mostrar este módulo"
      description="El problema quedó registrado. Reintentá la carga y, si vuelve a fallar, recargá la página en unos segundos."
      digest={error.digest}
      onRetry={retry}
      secondary={
        <Button
          asChild
          variant="outline"
          className="w-full cursor-pointer rounded-xl sm:w-auto"
        >
          <Link href="/consultas">Volver al listado</Link>
        </Button>
      }
    />
  );
}
