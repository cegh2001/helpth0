import { requestJson } from '@/lib/api-client';

export interface DoctorScheduleSetting {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * Doctor and schedule operations go through the shared client so a 401 on a
 * dialog redirects to login and a 5xx says "error del servidor" instead of
 * leaking a raw fetch failure.
 */
export async function registerDoctor(input: {
  name: string;
  specialty: string;
}): Promise<void> {
  await requestJson(
    '/api/doctors',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    'Error al registrar médico'
  );
}

export async function updateDoctor(input: {
  id: string;
  name: string;
  specialty: string;
}): Promise<void> {
  await requestJson(
    '/api/doctors',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    'Error al actualizar médico'
  );
}

export async function deactivateDoctor(id: string): Promise<void> {
  await requestJson(
    `/api/doctors?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Error al desactivar médico'
  );
}

export async function fetchDoctorSchedules(
  doctorId: string
): Promise<DoctorScheduleSetting[]> {
  const payload = await requestJson<{ data?: unknown }>(
    `/api/schedules?doctorId=${encodeURIComponent(doctorId)}`,
    undefined,
    'Error al cargar los horarios'
  );

  return Array.isArray(payload.data) ? (payload.data as DoctorScheduleSetting[]) : [];
}

export async function saveDoctorSchedules(
  doctorId: string,
  schedules: DoctorScheduleSetting[]
): Promise<void> {
  await requestJson(
    '/api/schedules',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, schedules }),
    },
    'Error al guardar los horarios'
  );
}
