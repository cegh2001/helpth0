import { NextRequest, NextResponse } from 'next/server';
import {
  getSpecialtyRatesUseCase,
  saveSpecialtyRateUseCase,
  deleteSpecialtyRateUseCase,
} from '@/infrastructure/container';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse, badRequest } from '@/lib/http-response';

export async function GET(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const data = await getSpecialtyRatesUseCase.execute();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'specialtyRates.GET');
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.specialty !== 'string' ||
      !body.specialty.trim() ||
      typeof body.standardRateUsd !== 'number' ||
      isNaN(body.standardRateUsd) ||
      body.standardRateUsd < 0
    ) {
      return badRequest('Especialidad y tarifa estándar válida son requeridas');
    }

    const rate = await saveSpecialtyRateUseCase.execute({
      id: typeof body.id === 'string' ? body.id : undefined,
      specialty: body.specialty,
      standardRateUsd: body.standardRateUsd,
    });

    return NextResponse.json({ success: true, data: rate }, { status: 201 });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'specialtyRates.POST');
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {}
    }

    if (!id || typeof id !== 'string') {
      return badRequest('El ID de la tarifa es obligatorio');
    }

    await deleteSpecialtyRateUseCase.execute(id);
    return NextResponse.json({ success: true, message: 'Tarifa eliminada' });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'specialtyRates.DELETE');
  }
}
