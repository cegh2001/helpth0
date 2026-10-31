'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { onSessionExpired } from '@/lib/api-client';

/**
 * One place that reacts to an expired session.
 *
 * Before this, only the daily overview redirected on 401; every other module
 * showed "Autenticación requerida" or "Error al obtener consultas" as if the
 * request had been invalid, and the user had no way to know they needed to log
 * in again.
 */
export function SessionExpiryListener() {
  const router = useRouter();

  useEffect(() => {
    return onSessionExpired(() => {
      toast.error('Tu sesión expiró', {
        id: 'session-expired',
        description: 'Volvé a iniciar sesión para continuar.',
        duration: 10000,
      });
      router.replace('/login');
    });
  }, [router]);

  return null;
}
