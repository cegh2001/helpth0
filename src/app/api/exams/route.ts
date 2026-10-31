import { NextRequest, NextResponse } from 'next/server';
import { getMedicalExamsUseCase } from '@/infrastructure/container';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse } from '@/lib/http-response';

export async function GET(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const status = searchParams.get('status') || undefined;
    const searchQuery = searchParams.get('search') || undefined;

    const exams = await getMedicalExamsUseCase.execute({
      startDate,
      endDate,
      status,
      searchQuery,
    });

    return NextResponse.json({ success: true, data: exams });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'exams.GET');
  }
}
