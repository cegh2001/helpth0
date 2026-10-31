'use client';

import { useState } from 'react';
import { FeedbackBanner } from '@/components/dashboard/feedback-banner';
import { useFeedback } from '@/components/dashboard/use-feedback';
import { useUrlState } from '@/components/dashboard/use-url-state';
import type { DoctorListItem } from './doctor-directory-api';
import { DoctorDeactivateDialog } from './doctor-deactivate-dialog';
import { DoctorDirectory } from './doctor-directory';
import { DoctorEditDialog } from './doctor-edit-dialog';
import { DoctorRegisterForm } from './doctor-register-form';
import { DoctorSchedulesDialog } from './doctor-schedules-dialog';
import { useDoctorDirectory } from './use-doctor-directory';

export function DoctorsPage({ initialQuery }: { initialQuery: string }) {
  const { feedback, showError, showSuccess, dismissFeedback } = useFeedback();
  const { doctors, isLoading, refresh } = useDoctorDirectory(showError);

  const [search, setSearch] = useUrlState('q', initialQuery);
  const [editingDoctor, setEditingDoctor] = useState<DoctorListItem | null>(null);
  const [deactivatingDoctor, setDeactivatingDoctor] = useState<DoctorListItem | null>(null);
  const [schedulingDoctor, setSchedulingDoctor] = useState<DoctorListItem | null>(null);

  const handleRegistered = (doctorName: string) => {
    showSuccess(`Médico ${doctorName} registrado con éxito`);
    void refresh();
  };

  const handleUpdated = () => {
    showSuccess('Médico actualizado con éxito');
    setEditingDoctor(null);
    void refresh();
  };

  const handleDeactivated = () => {
    showSuccess(`Dr. ${deactivatingDoctor?.name ?? ''} desactivado`);
    setDeactivatingDoctor(null);
    void refresh();
  };

  const handleSchedulesSaved = () => {
    showSuccess(`Horarios actualizados para ${schedulingDoctor?.name ?? ''}`);
    setSchedulingDoctor(null);
    void refresh();
  };

  return (
    <div className="space-y-6">
      {feedback && <FeedbackBanner message={feedback} onDismiss={dismissFeedback} />}

      <div>
        <h1 className="text-lg font-bold text-slate-900">Médicos y Horarios</h1>
        <p className="text-xs text-slate-500">
          Alta del personal médico, edición de datos y configuración de turnos semanales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DoctorRegisterForm onRegistered={handleRegistered} onError={showError} />
        <DoctorDirectory
          doctors={doctors}
          isLoading={isLoading}
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
          onError={showError}
        />
      )}

      {deactivatingDoctor && (
        <DoctorDeactivateDialog
          doctor={deactivatingDoctor}
          onClose={() => setDeactivatingDoctor(null)}
          onDeactivated={handleDeactivated}
          onError={showError}
        />
      )}

      {schedulingDoctor && (
        <DoctorSchedulesDialog
          doctor={schedulingDoctor}
          onClose={() => setSchedulingDoctor(null)}
          onSaved={handleSchedulesSaved}
          onError={showError}
        />
      )}
    </div>
  );
}
