import { NextRequest, NextResponse } from 'next/server';
import {
  generateReportDataUseCase,
  pdfExporter,
} from '@/infrastructure/container';
import { formatLocalDate } from '@/lib/date-utils';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse } from '@/lib/http-response';

export async function GET(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const today = formatLocalDate();
    const startDate = searchParams.get('startDate') || today;
    const endDate = searchParams.get('endDate') || today;

    const reportData = await generateReportDataUseCase.execute({
      startDate,
      endDate,
    });

    const buffer = await pdfExporter.exportToPdf(reportData);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="clinic-report-${startDate}-to-${endDate}.pdf"`,
      },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'reports.pdf.GET');
  }
}
