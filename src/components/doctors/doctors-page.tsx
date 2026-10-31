'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { notifyError, notifySuccess } from '@/components/dashboard/notify';
import { useUrlState } from '@/components/dashboard/use-url-state';
import { DoctorDeactivateDialog } from './doctor-deactivate-dialog';
import { DoctorDirectory } from './doctor-directory';
import { DoctorEditDialog } from './doctor-edit-dialog';
import type { DoctorListItem } from './doctor-list-item';
import { DoctorRegisterForm } from './doctor-register-form';
import { DoctorSchedulesDialog } from './doctor-schedules-dialog';

export function DoctorsPage({
  initialDoctors,
  initialQuery,
}: {
  initialDoctors: DoctorListItem[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const [search, setSearch] = useUrlState('q', initialQuery);
  const [editingDoctor, setEditingDoctor] = useState<DoctorListItem | null>(null);
  const [deactivatingDoctor, setDeactivatingDoctor] = useState<DoctorListItem | null>(null);
  const [schedulingDoctor, setSchedulingDoctor] = useState<DoctorListItem | null>(null);

  // The directory is read on the server: after a mutation we ask the route for a
  // new render instead of refetching the list in the browser.
  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const handleDoctorError = useCallback((error: unknown) => {
    notifyError(error, 'No se pudo completar la operación', { id: 'doctors' });
  }, []);

  const handleRegistered = (doctorName: string) => {
    notifySuccess(`Médico ${doctorName} registrado con éxito`, { id: 'doctors' });
    refresh();
  };

  const handleUpdated = () => {
    notifySuccess('Médico actualizado con éxito', { id: 'doctors' });
    setEditingDoctor(null);
    refresh();
  };

  const handleDeactivated = () => {
    notifySuccess(`Dr. ${deactivatingDoctor?.name ?? ''} desactivado`, { id: 'doctors' });
    setDeactivatingDoctor(null);
    refresh();
  };

  const handleSchedulesSaved = () => {
    notifySuccess(`Horarios actualizados para ${schedulingDoctor?.name ?? ''}`, { id: 'doctors' });
    setSchedulingDoctor(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Médicos y Horarios</h1>
        <p className="text-xs text-slate-500">
          Alta del personal médico, edición de datos y configuración de turnos semanales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DoctorRegisterForm onRegistered={handleRegistered} onError={handleDoctorError} />
        <DoctorDirectory
          doctors={initialDoctors}
          isLoading={isRefreshing}
          search={search}
          onSearchChange={setSearch}
          onEdit={setEditingDoctor}
          onManageSchedules={setSchedulingDoctor}
          onDeactivate={setDeactivatingDoctor}
        />
      </div>

      {editingDoctor && (
        <DoctorEditDialog
          doctor={editingDoctor}
          onClose={() => setEditingDoctor(null)}
          onUpdated={handleUpdated}
          onError={handleDoctorError}
        />
      )}

      {deactivatingDoctor && (
        <DoctorDeactivateDialog
          doctor={deactivatingDoctor}
          onClose={() => setDeactivatingDoctor(null)}
          onDeactivated={handleDeactivated}
          onError={handleDoctorError}
        />
      )}

      {schedulingDoctor && (
        <DoctorSchedulesDialog
          doctor={schedulingDoctor}
          onClose={() => setSchedulingDoctor(null)}
          onSaved={handleSchedulesSaved}
          onError={handleDoctorError}
        />
      )}
    </div>
  );
}
