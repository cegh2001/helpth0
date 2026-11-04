import { NextRequest, NextResponse } from 'next/server';
import {
  consultationRepository,
  consultationParser,
  importConsultationsUseCase,
  specialtyRateRepository,
  workbookModuleGuard,
} from '@/infrastructure/container';
import { resolveConsultationAmounts } from '@/core/application/use-cases/consultations/consultation-rate.calculator';
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
    let incomingConsultations: unknown = undefined;

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
      if (!body) {
        return NextResponse.json({ error: 'Cuerpo de solicitud requerido' }, { status: 400 });
      }
      if (Array.isArray(body.consultations)) {
        incomingConsultations = body.consultations;
      } else if (body.csvContent) {
        csvContent = body.csvContent;
      } else {
        return NextResponse.json({ error: 'Contenido CSV o consultas requerido' }, { status: 400 });
      }
    }

    if (fileBuffer) {
      const rejection = await workbookModuleGuard.detectWrongModule(fileBuffer, 'consultas');
      if (rejection) {
        return NextResponse.json({ error: rejection.message }, { status: 422 });
      }
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

      const ratesMap = new Map<string, number>();
      if (specialtyRateRepository) {
        const rates = await specialtyRateRepository.findAll();
        rates.forEach((r) => ratesMap.set(r.specialty.trim().toLowerCase(), r.standardRateUsd));
      }

      const rowsWithStatus = parseResult.consultations.map((c) => {
        const resolved = resolveConsultationAmounts(c, ratesMap);
        return {
          ...c,
          amountUsd: resolved.amountUsd,
          totalBs: resolved.totalBs,
          exoneratedAmountUsd: resolved.exoneratedAmountUsd,
          exonerationPercent: resolved.exonerationPercent,
          status: resolved.status,
          isDuplicate: existingHashes.has(c.importHash),
        };
      });

      const newRowsCount = rowsWithStatus.filter((r) => !r.isDuplicate).length;
      const duplicateCount = rowsWithStatus.length - newRowsCount;
      const totalExoneratedUsd = Number(
        rowsWithStatus.reduce((s, r) => s + r.exoneratedAmountUsd, 0).toFixed(2)
      );
      const exoneratedPatientsCount = rowsWithStatus.filter((r) => r.exoneratedAmountUsd > 0).length;

      return NextResponse.json({
        success: true,
        consultations: rowsWithStatus,
        summary: {
          ...parseResult.summary,
          totalExoneratedUsd,
          exoneratedPatientsCount,
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
      consultations: incomingConsultations as never,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error('[consultations.import.POST] error:', error);
    return apiErrorResponse(error, 'consultations.import.POST');
  }
}
