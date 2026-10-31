import type { Metadata } from 'next';
import { DoctorsPage } from '@/components/doctors/doctors-page';
import { readSearchParam } from '@/lib/search-params';

export const metadata: Metadata = {
  title: 'Médicos y Horarios',
};

interface DoctorsRouteProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function DoctorsRoute({ searchParams }: DoctorsRouteProps) {
  const params = await searchParams;

  return <DoctorsPage initialQuery={readSearchParam(params.q)} />;
}
