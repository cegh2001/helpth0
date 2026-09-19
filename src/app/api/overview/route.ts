import { NextRequest, NextResponse } from 'next/server';
import { getDailyOverviewUseCase } from '@/infrastructure/container';
import { formatLocalDate } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || formatLocalDate();

    const overview = await getDailyOverviewUseCase.execute(date);
    return NextResponse.json({ success: true, data: overview });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
