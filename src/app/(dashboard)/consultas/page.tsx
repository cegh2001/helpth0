import type { Metadata } from 'next';
import { ConsultationsModule } from '@/components/consultations/consultations-module';

export const metadata: Metadata = {
  title: 'Consultas y Pagos',
};

export default function ConsultationsPage() {
  return <ConsultationsModule />;
}
