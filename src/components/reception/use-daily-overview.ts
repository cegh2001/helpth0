'use client';

import { useCallback, useState } from 'react';
import type { DailyOverviewData } from './daily-overview';

/**
 * The day overview arrives rendered from the server. This hook only owns the
 * optimistic count updates: the browser paints the new number immediately, the
 * write goes to the API, and a failure resyncs with the server truth.
 */
export function useDailyOverview(
  initialOverview: DailyOverviewData,
  onError: (text: string) => void
) {
  const [overview, setOverview] = useState(initialOverview);
  const [countQueues] = useState(() => new Map<string, Promise<void>>());

  const resync = useCallback(async () => {
    try {
      const response = await fetch(`/api/overview?date=${overview.date}`);
      const payload = await response.json();
      if (payload.success) setOverview(payload.data);
    } catch {
      // The banner already reported the write failure; a second message would hide it.
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
        const response = await fetch('/api/counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorId,
            scheduleId,
            date: requestDate,
            patientCount: newCount,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Error al guardar el conteo');
        }
      });
      countQueues.set(slotKey, pendingUpdate);

      try {
        await pendingUpdate;
      } catch (error) {
        onError(
          error instanceof Error ? error.message : 'Error al sincronizar con la base de datos'
        );
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
