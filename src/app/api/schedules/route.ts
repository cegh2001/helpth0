import { NextRequest, NextResponse } from 'next/server';
import {
  getDoctorSchedulesUseCase,
  setDoctorSchedulesUseCase,
} from '@/infrastructure/container';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'doctorId query parameter is required' },
        { status: 400 }
      );
    }

    const schedules = await getDoctorSchedulesUseCase.execute(doctorId);
    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch schedules' },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await setDoctorSchedulesUseCase.execute({
      doctorId: body.doctorId,
      schedules: body.schedules || [],
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set schedules' },
      { status: 400 }
    );
  }
}
