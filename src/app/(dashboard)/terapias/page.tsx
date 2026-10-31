import type { Metadata } from 'next';
import { TherapiesModule } from '@/components/therapies/therapies-module';

export const metadata: Metadata = {
  title: 'Terapias y Rehabilitación',
};

export default function TherapiesPage() {
  return <TherapiesModule />;
}
