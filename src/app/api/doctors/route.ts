import { NextRequest, NextResponse } from 'next/server';
import {
  listDoctorsUseCase,
  registerDoctorUseCase,
  updateDoctorUseCase,
  deleteDoctorUseCase,
} from '@/infrastructure/container';
import { requireApiSession } from '@/lib/auth-guard';
import { apiErrorResponse, badRequest } from '@/lib/http-response';

export async function GET(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const doctors = await listDoctorsUseCase.execute(!all);
    return NextResponse.json({ success: true, data: doctors });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'doctors.GET');
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.name !== 'string' ||
      (body.specialty != null && typeof body.specialty !== 'string')
    ) {
      return badRequest('Datos del médico inválidos');
    }
    const doctor = await registerDoctorUseCase.execute({
      name: body.name,
      specialty: body.specialty,
    });
    return NextResponse.json({ success: true, data: doctor }, { status: 201 });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'doctors.POST');
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.id !== 'string' ||
      typeof body.name !== 'string' ||
      (body.specialty != null && typeof body.specialty !== 'string')
    ) {
      return badRequest('Datos del médico inválidos');
    }
    const updated = await updateDoctorUseCase.execute({
      id: body.id,
      name: body.name,
      specialty: body.specialty,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'doctors.PUT');
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
        id = body.id;
      } catch {}
    }

    if (!id) {
      return badRequest('El ID del médico es obligatorio');
    }

    await deleteDoctorUseCase.execute(id);
    return NextResponse.json({ success: true, message: 'Médico desactivado' });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'doctors.DELETE');
  }
}
