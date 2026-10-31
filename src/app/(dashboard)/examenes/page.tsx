import type { Metadata } from 'next';
import { ExamsModule } from '@/components/exams/exams-module';

export const metadata: Metadata = {
  title: 'Exámenes y Laboratorio',
};

export default function ExamsPage() {
  return <ExamsModule />;
}
