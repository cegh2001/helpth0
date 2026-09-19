import { describe, it, expect } from 'vitest';
import {
  registerDoctorUseCase,
  setDoctorSchedulesUseCase,
  recordPatientCountUseCase,
  getDailyOverviewUseCase,
  generateReportDataUseCase,
  excelExporter,
  pdfExporter,
} from '@/infrastructure/container';

describe('Prisma & SQLite End-to-End Flow', () => {
  it('should register a doctor, set weekly schedule, record headcount and export files', async () => {
    // 1. Register doctor
    const doctor = await registerDoctorUseCase.execute({
      name: 'Dr. Gregory House E2E',
      specialty: 'Infectious Diseases',
    });
    expect(doctor.id).toBeDefined();

    // 2. Set schedule
    const schedules = await setDoctorSchedulesUseCase.execute({
      doctorId: doctor.id,
      schedules: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '13:00' },
        { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
      ],
    });
    expect(schedules.length).toBe(2);

    // 3. Record headcount
    const count = await recordPatientCountUseCase.execute({
      doctorId: doctor.id,
      date: '2026-09-21',
      patientCount: 18,
      notes: 'Busy clinic morning',
    });
    expect(count.patientCount).toBe(18);

    // 4. Get daily overview for 2026-09-21 (Monday)
    const overview = await getDailyOverviewUseCase.execute('2026-09-21');
    const docOverview = overview.doctors.find((d) => d.doctorId === doctor.id);
    expect(docOverview).toBeDefined();
    expect(docOverview?.scheduledToday).toBe(true);
    expect(docOverview?.patientCount).toBe(18);

    // 5. Generate report data
    const reportData = await generateReportDataUseCase.execute({
      startDate: '2026-09-21',
      endDate: '2026-09-21',
    });
    expect(reportData.totalPatientsPeriod).toBeGreaterThanOrEqual(18);

    // 6. Test Excel export
    const excelBuffer = await excelExporter.exportToExcel(reportData);
    expect(excelBuffer.length).toBeGreaterThan(1000);

    // 7. Test PDF export
    const pdfBuffer = await pdfExporter.exportToPdf(reportData);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });
});
