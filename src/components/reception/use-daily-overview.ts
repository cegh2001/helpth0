'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DailyOverviewData } from './daily-overview';

interface UseDailyOverviewOptions {
  date: string;
  onError: (text: string) => void;
}

export function useDailyOverview({ date, onError }: UseDailyOverviewOptions) {
  const router = useRouter();
  const [overview, setOverview] = useState<DailyOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const requestRef = useRef<AbortController | null>(null);
  const [countQueues] = useState(() => new Map<string, Promise<void>>());

  useEffect(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    async function loadOverview() {
      try {
        const response = await fetch(`/api/overview?date=${date}`, {
          signal: controller.signal,
        });
        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        const payload = await response.json();
        if (controller.signal.aborted) return;
        if (payload.success) {
          setOverview(payload.data);
        } else {
          onError(payload.error || 'Error al cargar el resumen diario');
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        onError('Error de conexión al cargar datos');
      } finally {
        if (requestRef.current === controller) {
          setLoading(false);
        }
      }
    }

    void loadOverview();
    return () => controller.abort();
  }, [date, revision, router, onError]);

  const refresh = useCallback(() => {
    setRevision((current) => current + 1);
  }, []);

  const markLoading = useCallback(() => {
    setLoading(true);
  }, []);

  const updateCount = useCallback(
    async (doctorId: string, scheduleId: string | null, newCount: number) => {
      if (newCount < 0) return;
      const requestDate = date;

      setOverview((currentOverview) => {
        if (!currentOverview || currentOverview.date !== requestDate) return currentOverview;
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
        refresh();
      } finally {
        if (countQueues.get(slotKey) === pendingUpdate) {
          countQueues.delete(slotKey);
        }
      }
    },
    [countQueues, date, onError, refresh]
  );

  return { overview, loading, markLoading, refresh, updateCount };
}
