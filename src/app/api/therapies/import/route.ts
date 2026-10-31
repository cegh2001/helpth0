import { NextRequest, NextResponse } from 'next/server';
import {
  importTherapiesUseCase,
  therapyParser,
  therapyRepository,
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
    let incomingTherapies: unknown = undefined;

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

      if (
        fileObj.name.toLowerCase().endsWith('.xlsx') ||
        fileObj.name.toLowerCase().endsWith('.xls')
      ) {
        fileBuffer = buffer;
      } else {
        csvContent = buffer.toString('utf-8');
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ error: 'Cuerpo de solicitud requerido' }, { status: 400 });
      }
      if (Array.isArray(body.therapies)) {
        incomingTherapies = body.therapies;
      } else if (body.csvContent) {
        csvContent = body.csvContent;
      } else {
        return NextResponse.json(
          { error: 'Contenido CSV o sesiones de terapia requerido' },
          { status: 400 }
        );
      }
    }

    if (action === 'preview') {
      const parseResult = fileBuffer
        ? await therapyParser.parseFromBuffer(fileBuffer)
        : therapyParser.parseFromCsv(csvContent || '');

      const existingHashes = new Set<string>();

      if (parseResult.sessions.length > 0) {
        const found = await therapyRepository.findMany({
          startDate: parseResult.summary.dateRange?.min,
          endDate: parseResult.summary.dateRange?.max,
        });
        found.forEach((session) => existingHashes.add(session.importHash));
      }

      const rowsWithStatus = parseResult.sessions.map((session) => {
        const { importHash, ...row } = session;
        return { ...row, isDuplicate: existingHashes.has(importHash) };
      });

      const newRowsCount = rowsWithStatus.filter((row) => !row.isDuplicate).length;

      return NextResponse.json({
        success: true,
        therapies: rowsWithStatus,
        summary: {
          ...parseResult.summary,
          newRowsCount,
          duplicateCount: rowsWithStatus.length - newRowsCount,
        },
        errors: parseResult.errors,
      });
    }

    const result = await importTherapiesUseCase.execute({
      csvContent,
      buffer: fileBuffer,
      therapies: incomingTherapies as never,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error('[therapies.import.POST] error:', error);
    return apiErrorResponse(error, 'therapies.import.POST');
  }
}
