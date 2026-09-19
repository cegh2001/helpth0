import { Stethoscope } from 'lucide-react';
import { ALLOWED_USER_EMAIL } from '@/lib/auth-policy';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="min-h-svh bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-md items-center">
        <section
          aria-labelledby="login-title"
          className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60"
        >
          <div className="border-t-4 border-emerald-600 px-6 pb-5 pt-6 sm:px-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Stethoscope aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-700">helpth0</p>
                <p className="text-sm text-slate-500">Gestión clínica local</p>
              </div>
            </div>

            <h1 id="login-title" className="text-2xl font-bold text-slate-950">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ingresá la contraseña del usuario autorizado para acceder al panel.
            </p>

            <LoginForm email={ALLOWED_USER_EMAIL} />
          </div>
        </section>
      </div>
    </main>
  );
}