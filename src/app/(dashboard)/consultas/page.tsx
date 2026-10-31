import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getConsultationsUseCase } from '@/infrastructure/container';
import { ConsultationsModule } from '@/components/consultations/consultations-module';
import { toConsultationItems } from '@/components/consultations/consultation-item';

export const metadata: Metadata = {
  title: 'Consultas y Pagos',
};

export default async function ConsultationsPage() {
  // The list is live data: read it per request, never during prerendering.
  await connection();
  const consultations = await getConsultationsUseCase.execute();

  return <ConsultationsModule consultations={toConsultationItems(consultations)} />;
}
