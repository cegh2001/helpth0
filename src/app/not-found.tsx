import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Página no encontrada',
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Compass className="h-6 w-6 text-slate-500" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Error 404
          </p>
          <h1 className="text-base font-bold text-slate-900">Página no encontrada</h1>
          <p className="text-xs leading-relaxed text-slate-500">
            El enlace puede estar vencido o la sección ya no existe. Volvé al listado para seguir
            trabajando.
          </p>
        </div>

        <Button asChild className="w-full cursor-pointer rounded-xl sm:w-auto">
          <Link href="/consultas">Ir a Consultas y Pagos</Link>
        </Button>
      </div>
    </div>
  );
}
