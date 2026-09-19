import { NextRequest, NextResponse } from 'next/server';
import {
  generateReportDataUseCase,
  pdfExporter,
} from '@/infrastructure/container';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().split('T')[0];
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate PDF report' },
      { status: 400 }
    );
  }
}
