import { NextRequest, NextResponse } from 'next/server';
import {
  listDoctorsUseCase,
  registerDoctorUseCase,
  updateDoctorUseCase,
  deleteDoctorUseCase,
} from '@/infrastructure/container';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const doctors = await listDoctorsUseCase.execute(!all);
    return NextResponse.json({ success: true, data: doctors });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const doctor = await registerDoctorUseCase.execute({
      name: body.name,
      specialty: body.specialty,
    });
    return NextResponse.json({ success: true, data: doctor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar médico' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'El ID del médico es obligatorio' },
        { status: 400 }
      );
    }
    const updated = await updateDoctorUseCase.execute({
      id: body.id,
      name: body.name,
      specialty: body.specialty,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar médico' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
      return NextResponse.json(
        { success: false, error: 'El ID del médico es requerido' },
        { status: 400 }
      );
    }

    await deleteDoctorUseCase.execute(id);
    return NextResponse.json({ success: true, message: 'Médico eliminado con éxito' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar médico' },
      { status: 400 }
    );
  }
}
