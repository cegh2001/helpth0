import { NextRequest, NextResponse } from 'next/server';
import { getConsultationsUseCase } from '@/infrastructure/container';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse } from '@/lib/http-response';

export async function GET(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const specialty = searchParams.get('specialty') || undefined;
    const doctorName = searchParams.get('doctorName') || undefined;
    const status = searchParams.get('status') || undefined;

    const consultations = await getConsultationsUseCase.execute({
      startDate,
      endDate,
      specialty,
      doctorName,
      status,
    });

    return NextResponse.json({ success: true, data: consultations });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'consultations.GET');
  }
}
