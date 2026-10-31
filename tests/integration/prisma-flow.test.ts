import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import {
  registerDoctorUseCase,
  setDoctorSchedulesUseCase,
  recordPatientCountUseCase,
  getDailyOverviewUseCase,
  generateReportDataUseCase,
  excelExporter,
  pdfExporter,
} from '@/infrastructure/container';
import { prisma } from '@/infrastructure/persistence/prisma/prisma.client';

const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const isPostgresConfigured = Boolean(
  testDbUrl &&
    (testDbUrl.startsWith('postgresql://') || testDbUrl.startsWith('postgres://'))
);

const describePostgresE2E = isPostgresConfigured ? describe : describe.skip;

describePostgresE2E('Prisma & PostgreSQL End-to-End Flow', () => {
  beforeAll(async () => {
    execSync('pnpm exec prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'ignore',
    });
  }, 30_000);

  afterAll(async () => {
    try {
      await prisma.dailyCount.deleteMany({
        where: { doctor: { name: 'Dr. Gregory House E2E' } },
      });
      await prisma.schedule.deleteMany({
        where: { doctor: { name: 'Dr. Gregory House E2E' } },
      });
      await prisma.doctor.deleteMany({
        where: { name: 'Dr. Gregory House E2E' },
      });
    } catch {
      // Ignored if tables don't exist yet
    }
    await prisma.$disconnect();
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
      scheduleId: schedules[0].id,
      date: '2026-09-21',
      patientCount: 18,
    });
    expect(count.patientCount).toBe(18);

    // 4. Get daily overview for 2026-09-21 (Monday)
    const overview = await getDailyOverviewUseCase.execute('2026-09-21');
    const docOverview = overview.doctors.find((d) => d.doctorId === doctor.id);
    expect(docOverview).toBeDefined();
    expect(docOverview?.scheduledToday).toBe(true);
    expect(docOverview?.patientCount).toBe(18);

    // 5. Remove schedules after recording; the report must retain the recorded shift snapshot.
    await setDoctorSchedulesUseCase.execute({
      doctorId: doctor.id,
      schedules: [],
    });

    // 6. Generate report data
    const reportData = await generateReportDataUseCase.execute({
      startDate: '2026-09-21',
      endDate: '2026-09-21',
    });
    expect(reportData.totalPatientsPeriod).toBeGreaterThanOrEqual(18);
    expect(
      reportData.doctors.find((item) => item.doctorId === doctor.id)?.dailyBreakdown[0].shiftTime
    ).toBe('08:00 - 13:00');

    // 7. Test Excel export
    const excelBuffer = await excelExporter.exportToExcel(reportData);
    expect(excelBuffer.length).toBeGreaterThan(1000);

    // 8. Test PDF export
    const pdfBuffer = await pdfExporter.exportToPdf(reportData);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });
});
