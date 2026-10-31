import { formatLocalDate } from '@/lib/date-utils';

export interface DoctorListItem {
  id: string;
  name: string;
  specialty: string;
}

export interface DoctorScheduleSetting {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface OverviewDoctor {
  doctorId: string;
  doctorName: string;
  specialty: string;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return response.json().catch(() => ({}));
}

function failureMessage(payload: Record<string, unknown>, fallback: string): string {
  return typeof payload.error === 'string' ? payload.error : fallback;
}

export async function fetchDoctors(): Promise<DoctorListItem[]> {
  const response = await fetch(`/api/overview?date=${formatLocalDate()}`);
  const payload = await readJson(response);
  if (!response.ok || payload.success !== true) {
    throw new Error(failureMessage(payload, 'Error al cargar los médicos'));
  }
  const data = payload.data as { doctors?: OverviewDoctor[] } | undefined;
  return (data?.doctors ?? []).map((doctor) => ({
    id: doctor.doctorId,
    name: doctor.doctorName,
    specialty: doctor.specialty,
  }));
}

export async function registerDoctor(input: {
  name: string;
  specialty: string;
}): Promise<void> {
  const response = await fetch('/api/doctors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.success !== true) {
    throw new Error(failureMessage(payload, 'Error al registrar médico'));
  }
}

export async function updateDoctor(input: {
  id: string;
  name: string;
  specialty: string;
}): Promise<void> {
  const response = await fetch('/api/doctors', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.success !== true) {
    throw new Error(failureMessage(payload, 'Error al actualizar médico'));
  }
}

export async function deactivateDoctor(id: string): Promise<void> {
  const response = await fetch(`/api/doctors?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const payload = await readJson(response);
  if (!response.ok || payload.success !== true) {
    throw new Error(failureMessage(payload, 'Error al desactivar médico'));
  }
}

export async function fetchDoctorSchedules(
  doctorId: string
): Promise<DoctorScheduleSetting[]> {
  const response = await fetch(`/api/schedules?doctorId=${encodeURIComponent(doctorId)}`);
  const payload = await readJson(response);
  if (!response.ok || payload.success !== true) {
    throw new Error(failureMessage(payload, 'Error al cargar los horarios'));
  }
  return Array.isArray(payload.data) ? (payload.data as DoctorScheduleSetting[]) : [];
}

export async function saveDoctorSchedules(
  doctorId: string,
  schedules: DoctorScheduleSetting[]
): Promise<void> {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorId, schedules }),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.success !== true) {
    throw new Error(failureMessage(payload, 'Error al guardar los horarios'));
  }
}
