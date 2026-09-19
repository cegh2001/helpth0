import { NextRequest, NextResponse } from 'next/server';
import { recordPatientCountUseCase } from '@/infrastructure/container';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse, badRequest } from '@/lib/http-response';

export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.doctorId !== 'string' ||
      typeof body.date !== 'string' ||
      !Number.isInteger(body.patientCount) ||
      (body.scheduleId != null && typeof body.scheduleId !== 'string')
    ) {
      return badRequest('Datos de conteo inválidos');
    }

    const result = await recordPatientCountUseCase.execute({
      doctorId: body.doctorId,
      scheduleId: body.scheduleId ?? null,
      date: body.date,
      patientCount: body.patientCount,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'counts.POST');
  }
}
