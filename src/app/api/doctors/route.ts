import { NextRequest, NextResponse } from 'next/server';
import {
  listDoctorsUseCase,
  registerDoctorUseCase,
} from '@/infrastructure/container';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const doctors = await listDoctorsUseCase.execute(!all);
    return NextResponse.json({ success: true, data: doctors });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
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
      { success: false, error: error.message || 'Failed to register doctor' },
      { status: 400 }
    );
  }
}
