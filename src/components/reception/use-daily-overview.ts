'use client';

import { useCallback, useState } from 'react';
import { requestJson } from '@/lib/api-client';
import type { DailyOverviewData } from './daily-overview';

/**
 * The day overview arrives rendered from the server. This hook only owns the
 * optimistic count updates: the browser paints the new number immediately, the
 * write goes to the API, and a failure resyncs with the server truth.
 */
export function useDailyOverview(
  initialOverview: DailyOverviewData,
  onError: (error: unknown) => void
) {
  const [overview, setOverview] = useState(initialOverview);
  const [countQueues] = useState(() => new Map<string, Promise<void>>());

  const resync = useCallback(async () => {
    try {
      const payload = await requestJson<{ data?: DailyOverviewData }>(
        `/api/overview?date=${overview.date}`,
        undefined,
        'Error al recargar el resumen diario'
      );
      if (payload.data) setOverview(payload.data);
    } catch {
      // The write failure was already reported; a second toast would bury it.
    }
  }, [overview.date]);

  const updateCount = useCallback(
    async (doctorId: string, scheduleId: string | null, newCount: number) => {
      if (newCount < 0) return;
      const requestDate = overview.date;

      setOverview((currentOverview) => {
        if (currentOverview.date !== requestDate) return currentOverview;
        const updatedDoctors = currentOverview.doctors.map((doctor) => {
          if (doctor.doctorId !== doctorId) return doctor;
          const updatedSlots = (doctor.shiftSlots || []).map((slot) =>
            (slot.scheduleId || null) === (scheduleId || null)
              ? { ...slot, patientCount: newCount }
              : slot
          );
          const newDoctorTotal = updatedSlots.reduce((acc, slot) => acc + slot.patientCount, 0);
          return { ...doctor, shiftSlots: updatedSlots, patientCount: newDoctorTotal };
        });
        const newTotal = updatedDoctors.reduce((acc, doctor) => acc + doctor.patientCount, 0);
        return { ...currentOverview, doctors: updatedDoctors, totalPatientsToday: newTotal };
      });

      const slotKey = `${doctorId}:${scheduleId ?? 'unassigned'}:${requestDate}`;
      const previousUpdate = countQueues.get(slotKey) ?? Promise.resolve();
      const pendingUpdate = previousUpdate.catch(() => undefined).then(async () => {
        await requestJson(
          '/api/counts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctorId,
              scheduleId,
              date: requestDate,
              patientCount: newCount,
            }),
          },
          'Error al guardar el conteo'
        );
      });
      countQueues.set(slotKey, pendingUpdate);

      try {
        await pendingUpdate;
      } catch (error) {
        onError(error);
        await resync();
      } finally {
        if (countQueues.get(slotKey) === pendingUpdate) {
          countQueues.delete(slotKey);
        }
      }
    },
    [countQueues, onError, overview.date, resync]
  );

  return { overview, updateCount };
}
