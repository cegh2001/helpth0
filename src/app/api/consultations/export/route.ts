import { NextRequest, NextResponse } from 'next/server';
import { exportConsultationsUseCase } from '@/infrastructure/container';
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
    const titlePeriod = searchParams.get('period') || 'OCTUBRE 2026';

    const buffer = await exportConsultationsUseCase.execute(
      {
        startDate,
        endDate,
        specialty,
        doctorName,
      },
      titlePeriod
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="consultas-${titlePeriod.toLowerCase().replace(/\s+/g, '-')}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'consultations.export.GET');
  }
}
