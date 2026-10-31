import type { Metadata } from 'next';
import { getDailyOverviewUseCase } from '@/infrastructure/container';
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
  const date = resolveDateParam(params.date);

  // Awaiting searchParams already pins this render to the request, so no
  // connection() call is needed. The overview is live data: one read per request.
  const overview = await getDailyOverviewUseCase.execute(date);

  return (
    <ReceptionPage
      key={date}
      initialDate={date}
      initialQuery={readSearchParam(params.q)}
      initialOverview={overview}
    />
  );
}
