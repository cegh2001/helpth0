import { NextRequest, NextResponse } from 'next/server';
import {
  getDoctorSchedulesUseCase,
  setDoctorSchedulesUseCase,
} from '@/infrastructure/container';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse, badRequest } from '@/lib/http-response';

export async function GET(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return badRequest('El médico es obligatorio');
    }

    const schedules = await getDoctorSchedulesUseCase.execute(doctorId);
    return NextResponse.json({ success: true, data: schedules });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'schedules.GET');
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.doctorId !== 'string' ||
      !Array.isArray(body.schedules) ||
      !body.schedules.every((schedule: unknown) => {
        if (!schedule || typeof schedule !== 'object') return false;
        const item = schedule as Record<string, unknown>;
        return Number.isInteger(item.dayOfWeek)
          && typeof item.startTime === 'string'
          && typeof item.endTime === 'string';
      })
    ) {
      return badRequest('Datos de turnos inválidos');
    }
    const result = await setDoctorSchedulesUseCase.execute({
      doctorId: body.doctorId,
      schedules: body.schedules,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'schedules.POST');
  }
}
