import { NextRequest, NextResponse } from 'next/server';
import {
  consultationRepository,
  consultationParser,
  importConsultationsUseCase,
} from '@/infrastructure/container';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse } from '@/lib/http-response';

export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'confirm';

    let csvContent: string | undefined;
    let fileBuffer: Buffer | undefined;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
      }

      const fileObj = file as File;
      const arrayBuffer = await fileObj.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (fileObj.name.toLowerCase().endsWith('.xlsx') || fileObj.name.toLowerCase().endsWith('.xls')) {
        fileBuffer = buffer;
      } else {
        csvContent = buffer.toString('utf-8');
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body || !body.csvContent) {
        return NextResponse.json({ error: 'Contenido CSV o archivo requerido' }, { status: 400 });
      }
      csvContent = body.csvContent;
    }

    if (action === 'preview') {
      const parseResult = fileBuffer
        ? await consultationParser.parseFromBuffer(fileBuffer)
        : consultationParser.parseFromCsv(csvContent || '');

      const hashes = parseResult.consultations.map((c) => c.importHash);
      const existingHashes = new Set<string>();

      if (hashes.length > 0) {
        const found = await consultationRepository.findMany({
          startDate: parseResult.summary.dateRange?.min,
          endDate: parseResult.summary.dateRange?.max,
        });
        found.forEach((c) => existingHashes.add(c.importHash));
      }

      const rowsWithStatus = parseResult.consultations.map((c) => ({
        ...c,
        isDuplicate: existingHashes.has(c.importHash),
      }));

      const newRowsCount = rowsWithStatus.filter((r) => !r.isDuplicate).length;
      const duplicateCount = rowsWithStatus.length - newRowsCount;

      return NextResponse.json({
        success: true,
        consultations: rowsWithStatus,
        summary: {
          ...parseResult.summary,
          newRowsCount,
          duplicateCount,
        },
        errors: parseResult.errors,
      });
    }

    // Default: confirm & save
    const result = await importConsultationsUseCase.execute({
      csvContent,
      buffer: fileBuffer,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'consultations.import.POST');
  }
}
