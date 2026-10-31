import { NextRequest, NextResponse } from 'next/server';
import {
  generateReportDataUseCase,
  excelExporter,
} from '@/infrastructure/container';
import { formatLocalDate } from '@/lib/date-utils';
import { buildExportFileName } from '@/lib/export-file-name';
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

    const buffer = await excelExporter.exportToExcel(reportData);

    const fileName = buildExportFileName({
      module: 'reporte',
      startDate,
      endDate,
      extension: 'xlsx',
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'reports.excel.GET');
  }
}
