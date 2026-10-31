import type { Metadata } from 'next';
import { connection } from 'next/server';
import { listDoctorsUseCase } from '@/infrastructure/container';
import { DoctorsPage } from '@/components/doctors/doctors-page';
import { toDoctorListItems } from '@/components/doctors/doctor-list-item';
import { readSearchParam } from '@/lib/search-params';

export const metadata: Metadata = {
  title: 'Médicos y Horarios',
};

interface DoctorsRouteProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function DoctorsRoute({ searchParams }: DoctorsRouteProps) {
  const params = await searchParams;

  // The directory is live data: read it per request, never during prerendering.
  await connection();
  const doctors = await listDoctorsUseCase.execute(true);

  return (
    <DoctorsPage
      initialDoctors={toDoctorListItems(doctors)}
      initialQuery={readSearchParam(params.q)}
    />
  );
}
