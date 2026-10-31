import { NextRequest, NextResponse } from 'next/server';
import { exportMedicalExamsUseCase } from '@/infrastructure/container';
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
    const titlePeriod = searchParams.get('period') || 'OCTUBRE 2026';

    const buffer = await exportMedicalExamsUseCase.execute(
      {
        startDate,
        endDate,
        status,
      },
      titlePeriod
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="examenes-${titlePeriod.toLowerCase().replace(/\s+/g, '-')}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'exams.export.GET');
  }
}
