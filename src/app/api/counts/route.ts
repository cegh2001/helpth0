import { NextRequest, NextResponse } from 'next/server';
import { recordPatientCountUseCase } from '@/infrastructure/container';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await recordPatientCountUseCase.execute({
      doctorId: body.doctorId,
      scheduleId: body.scheduleId || null,
      date: body.date,
      patientCount: Number(body.patientCount),
      notes: body.notes,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record patient count' },
      { status: 400 }
    );
  }
}
