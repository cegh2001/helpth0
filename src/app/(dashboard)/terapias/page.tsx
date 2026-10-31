import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getTherapiesUseCase } from '@/infrastructure/container';
import { TherapiesModule } from '@/components/therapies/therapies-module';
import { toTherapySessionItems } from '@/components/therapies/therapy-session-item';

export const metadata: Metadata = {
  title: 'Terapias y Rehabilitación',
};

export default async function TherapiesPage() {
  // The session list is live data: read it per request, never during prerendering.
  await connection();
  const sessions = await getTherapiesUseCase.execute();

  return <TherapiesModule therapies={toTherapySessionItems(sessions)} />;
}
