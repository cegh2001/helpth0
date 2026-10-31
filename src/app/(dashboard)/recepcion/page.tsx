import type { Metadata } from 'next';
import { ReceptionPage } from '@/components/reception/reception-page';
import { readSearchParam, resolveDateParam } from '@/lib/search-params';

export const metadata: Metadata = {
  title: 'Recepción Diaria',
};

interface ReceptionRouteProps {
  searchParams: Promise<{ date?: string | string[]; q?: string | string[] }>;
}

export default async function ReceptionRoute({ searchParams }: ReceptionRouteProps) {
  const params = await searchParams;

  return (
    <ReceptionPage
      initialDate={resolveDateParam(params.date)}
      initialQuery={readSearchParam(params.q)}
    />
  );
}
