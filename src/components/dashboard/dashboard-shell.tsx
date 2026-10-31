'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Activity, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { DashboardNav } from './dashboard-nav';
import { notifyError } from './notify';
import { SessionExpiryListener } from './session-expiry-listener';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const result = await authClient.signOut();
      if (result?.error) throw new Error('No se pudo cerrar sesión');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      notifyError(error, 'No se pudo cerrar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SessionExpiryListener />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30">
              <Activity className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">helpth0</p>
              <p className="text-xs text-slate-500">
                Control de Turnos Médicos y Conteo Diario de Pacientes
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="cursor-pointer hover:bg-slate-100 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <DashboardNav />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
