import { NextRequest, NextResponse } from 'next/server';
import { getDailyOverviewUseCase } from '@/infrastructure/container';
import { formatLocalDate } from '@/lib/date-utils';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse } from '@/lib/http-response';

export async function GET(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || formatLocalDate();

    const overview = await getDailyOverviewUseCase.execute(date);
    return NextResponse.json({ success: true, data: overview });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'overview.GET');
  }
}
