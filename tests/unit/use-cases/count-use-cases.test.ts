import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDoctorRepository } from '../../mocks/in-memory-doctor.repository';
import { InMemoryDailyCountRepository } from '../../mocks/in-memory-daily-count.repository';
import { InMemoryScheduleRepository } from '../../mocks/in-memory-schedule.repository';
import { Doctor } from '@/core/domain/entities/doctor.entity';
import { WeeklySchedule } from '@/core/domain/entities/schedule.entity';
import { RecordPatientCountUseCase } from '@/core/application/use-cases/count/record-patient-count.use-case';
import { GetDailyOverviewUseCase } from '@/core/application/use-cases/count/get-daily-overview.use-case';
import { GenerateReportDataUseCase } from '@/core/application/use-cases/reports/generate-report-data.use-case';
import { DoctorReportRow } from '@/core/application/ports/report-exporter.port';

describe('Count and Overview Use Cases', () => {
  let doctorRepo: InMemoryDoctorRepository;
  let countRepo: InMemoryDailyCountRepository;
  let scheduleRepo: InMemoryScheduleRepository;
  let recordCountUseCase: RecordPatientCountUseCase;
  let dailyOverviewUseCase: GetDailyOverviewUseCase;
  let reportDataUseCase: GenerateReportDataUseCase;
  let doctor1: Doctor;
  let doctor2: Doctor;

  beforeEach(async () => {
    doctorRepo = new InMemoryDoctorRepository();
    countRepo = new InMemoryDailyCountRepository();
    scheduleRepo = new InMemoryScheduleRepository();

    recordCountUseCase = new RecordPatientCountUseCase(doctorRepo, countRepo);
    dailyOverviewUseCase = new GetDailyOverviewUseCase(doctorRepo, scheduleRepo, countRepo);
    reportDataUseCase = new GenerateReportDataUseCase(doctorRepo, scheduleRepo, countRepo);

    doctor1 = Doctor.create({ name: 'Dr. Gregory House', specialty: 'Diagnostics' });
    doctor2 = Doctor.create({ name: 'Dr. James Wilson', specialty: 'Oncology' });
    await doctorRepo.save(doctor1);
    await doctorRepo.save(doctor2);

    // Schedule for Monday (dayOfWeek = 1): 2026-09-21 is a Monday
    await scheduleRepo.save(WeeklySchedule.create({
      doctorId: doctor1.id,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '14:00',
    }));
  });

  it('should record patient headcount for a doctor on a specific date', async () => {
    const record = await recordCountUseCase.execute({
      doctorId: doctor1.id,
      date: '2026-09-21',
      patientCount: 14,
      notes: 'Consultation & follow-ups',
    });

    expect(record.doctorId).toBe(doctor1.id);
    expect(record.date).toBe('2026-09-21');
    expect(record.patientCount).toBe(14);

    const saved = await countRepo.findByDoctorAndDate(doctor1.id, '2026-09-21');
    expect(saved?.patientCount).toBe(14);
  });

  it('should update existing count if record already exists for the date', async () => {
    await recordCountUseCase.execute({
      doctorId: doctor1.id,
      date: '2026-09-21',
      patientCount: 10,
    });

    const updated = await recordCountUseCase.execute({
      doctorId: doctor1.id,
      date: '2026-09-21',
      patientCount: 16,
      notes: 'Added afternoon patients',
    });

    expect(updated.patientCount).toBe(16);
    expect(updated.notes).toBe('Added afternoon patients');
  });

  it('should get a complete daily overview for all doctors on a given date', async () => {
    // 2026-09-21 is Monday (dayOfWeek = 1)
    await recordCountUseCase.execute({
      doctorId: doctor1.id,
      date: '2026-09-21',
      patientCount: 20,
    });

    const overview = await dailyOverviewUseCase.execute('2026-09-21');

    expect(overview.date).toBe('2026-09-21');
    expect(overview.dayOfWeek).toBe(1);
    expect(overview.totalPatientsToday).toBe(20);
    expect(overview.doctors.length).toBe(2);

    const doc1Overview = overview.doctors.find((d) => d.doctorId === doctor1.id);
    expect(doc1Overview?.patientCount).toBe(20);
    expect(doc1Overview?.scheduledToday).toBe(true);
    expect(doc1Overview?.schedules.length).toBe(1);

    const doc2Overview = overview.doctors.find((d) => d.doctorId === doctor2.id);
    expect(doc2Overview?.patientCount).toBe(0);
    expect(doc2Overview?.scheduledToday).toBe(false);
  });

  it('should generate aggregated report data across a date range', async () => {
    await recordCountUseCase.execute({ doctorId: doctor1.id, date: '2026-09-21', patientCount: 15 });
    await recordCountUseCase.execute({ doctorId: doctor1.id, date: '2026-09-22', patientCount: 25 });
    await recordCountUseCase.execute({ doctorId: doctor2.id, date: '2026-09-22', patientCount: 10 });

    const report = await reportDataUseCase.execute({
      startDate: '2026-09-21',
      endDate: '2026-09-22',
    });

    expect(report.totalPatientsPeriod).toBe(50);
    expect(report.doctors.length).toBe(2);

    const doc1Row = report.doctors.find((d: DoctorReportRow) => d.doctorId === doctor1.id);
    expect(doc1Row?.totalPatients).toBe(40);
    expect(doc1Row?.dailyBreakdown.length).toBe(2);

    const doc2Row = report.doctors.find((d: DoctorReportRow) => d.doctorId === doctor2.id);
    expect(doc2Row?.totalPatients).toBe(10);
  });
});
