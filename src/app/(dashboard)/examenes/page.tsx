import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getMedicalExamsUseCase } from '@/infrastructure/container';
import { ExamsModule } from '@/components/exams/exams-module';
import { toMedicalExamItems } from '@/components/exams/medical-exam-item';

export const metadata: Metadata = {
  title: 'Exámenes y Laboratorio',
};

export default async function ExamsPage() {
  // The list is live data: read it per request, never during prerendering.
  await connection();
  const exams = await getMedicalExamsUseCase.execute();

  return <ExamsModule exams={toMedicalExamItems(exams)} />;
}
