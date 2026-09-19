import { ShieldCheck } from 'lucide-react';
import { ALLOWED_USER_EMAIL } from '@/lib/auth-policy';
import { SetupForm } from './setup-form';

export default function SetupPage() {
  return (
    <main className="min-h-svh bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-md items-center">
        <section
          aria-labelledby="setup-title"
          className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60"
        >
          <div className="border-t-4 border-blue-700 px-6 pb-5 pt-6 sm:px-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">Configuración inicial</p>
                <p className="text-sm text-slate-500">Acceso único del consultorio</p>
              </div>
            </div>

            <h1 id="setup-title" className="text-2xl font-bold text-slate-950">
              Crear acceso local
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Definí la contraseña que se usará para ingresar a este equipo.
            </p>

            <SetupForm email={ALLOWED_USER_EMAIL} />
          </div>
        </section>
      </div>
    </main>
  );
}