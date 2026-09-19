'use client';

import { FormEvent, useState } from 'react';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

interface LoginFormProps {
  email: string;
}

export function LoginForm({ email }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        rememberMe: false,
      });

      if (result.error) {
        setError('El correo o la contraseña no son válidos.');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('No se pudo iniciar sesión. Intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login-email">Correo electrónico</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          value={email}
          autoComplete="username"
          readOnly
          className="h-11 bg-slate-50 text-slate-700"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          minLength={8}
          maxLength={128}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'login-error' : undefined}
          className="h-11"
        />
      </div>

      {error ? (
        <p id="login-error" role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 w-full bg-emerald-700 hover:bg-emerald-800">
        <LogIn aria-hidden="true" />
        {isSubmitting ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  );
}