'use client';

import { useCallback, useEffect, useState } from 'react';
import { DoctorListItem, fetchDoctors } from './doctor-directory-api';

export function useDoctorDirectory(onError: (text: string) => void) {
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const directory = await fetchDoctors();
        if (!ignore) setDoctors(directory);
      } catch (error) {
        if (!ignore) {
          onError(error instanceof Error ? error.message : 'Error de red al cargar médicos');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [onError, revision]);

  const refresh = useCallback(() => {
    setRevision((current) => current + 1);
  }, []);

  return { doctors, isLoading, refresh };
}
