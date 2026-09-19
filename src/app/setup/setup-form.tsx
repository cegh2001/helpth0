'use client';

import { FormEvent, useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SetupFormProps {
  email: string;
}

export function SetupForm({ email }: SetupFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function checkSetup() {
      try {
        const response = await fetch('/api/setup', {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error('Setup status request failed');
        }
        if (data.configured) {
          router.replace('/login');
          router.refresh();
          return;
        }

        setIsChecking(false);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return;
        }
        setError('No se pudo verificar el estado de configuración.');
        setIsChecking(false);
      }
    }

    void checkSetup();
    return () => controller.abort();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'No se pudo completar la configuración inicial.');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('No se pudo completar la configuración inicial.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return (
      <p role="status" className="mt-6 text-sm text-slate-600">
        Verificando configuración...
      </p>
    );
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="setup-email">Correo electrónico</Label>
        <Input
          id="setup-email"
          name="email"
          type="email"
          value={email}
          autoComplete="username"
          readOnly
          className="h-11 bg-slate-50 text-slate-700"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="setup-password">Contraseña</Label>
        <Input
          id="setup-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'setup-error' : 'setup-password-help'}
          className="h-11"
        />
        <p id="setup-password-help" className="text-xs leading-5 text-slate-500">
          Usá entre 8 y 128 caracteres.
        </p>
      </div>

      {error ? (
        <p id="setup-error" role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 w-full bg-blue-700 hover:bg-blue-800">
        <KeyRound aria-hidden="true" />
        {isSubmitting ? 'Configurando...' : 'Crear acceso'}
      </Button>
    </form>
  );
}