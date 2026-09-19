import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
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
  beforeAll(() => {
    // Ensure test.db has the schema pushed
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'ignore',
    });
  });

  afterAll(() => {
    // Clean up test database files
    const testDb = path.resolve(process.cwd(), 'test.db');
    const testDbJournal = path.resolve(process.cwd(), 'test.db-journal');
    if (fs.existsSync(testDb)) {
      try { fs.unlinkSync(testDb); } catch {}
    }
    if (fs.existsSync(testDbJournal)) {
      try { fs.unlinkSync(testDbJournal); } catch {}
    }
  });

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
