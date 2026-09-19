import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDoctorRepository } from '../../mocks/in-memory-doctor.repository';
import { InMemoryDailyCountRepository } from '../../mocks/in-memory-daily-count.repository';
import { InMemoryScheduleRepository } from '../../mocks/in-memory-schedule.repository';
import { Doctor } from '@/core/domain/entities/doctor.entity';
import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';
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

    recordCountUseCase = new RecordPatientCountUseCase(doctorRepo, scheduleRepo, countRepo);
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
    });

    expect(updated.patientCount).toBe(16);
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

  it('should support granular counting across multiple shifts on the same day', async () => {
    const morningShift = (await scheduleRepo.findByDoctorId(doctor1.id))[0];
    const afternoonShift = WeeklySchedule.create({
      doctorId: doctor1.id,
      dayOfWeek: 1,
      startTime: '14:00',
      endTime: '18:00',
    });
    await scheduleRepo.save(afternoonShift);

    await recordCountUseCase.execute({
      doctorId: doctor1.id,
      scheduleId: morningShift.id,
      date: '2026-09-21',
      patientCount: 8,
    });

    await recordCountUseCase.execute({
      doctorId: doctor1.id,
      scheduleId: afternoonShift.id,
      date: '2026-09-21',
      patientCount: 12,
    });

    const overview = await dailyOverviewUseCase.execute('2026-09-21');
    const doc1 = overview.doctors.find((d) => d.doctorId === doctor1.id);

    expect(doc1?.patientCount).toBe(20);
    expect(doc1?.shiftSlots.length).toBe(2);
    expect(doc1?.shiftSlots[0].patientCount).toBe(8);
    expect(doc1?.shiftSlots[1].patientCount).toBe(12);

    const report = await reportDataUseCase.execute({
      startDate: '2026-09-21',
      endDate: '2026-09-21',
    });
    const doc1Report = report.doctors.find((d) => d.doctorId === doctor1.id);
    expect(doc1Report?.dailyBreakdown.length).toBe(2);
    expect(doc1Report?.dailyBreakdown[0].shiftTime).toBe('08:00 - 14:00');
    expect(doc1Report?.dailyBreakdown[1].shiftTime).toBe('14:00 - 18:00');
  });

  it('should reject a schedule that does not exist', async () => {
    await expect(
      recordCountUseCase.execute({
        doctorId: doctor1.id,
        scheduleId: 'missing-schedule',
        date: '2026-09-21',
        patientCount: 3,
      })
    ).rejects.toThrowError('Schedule not found');
  });

  it('should reject a schedule owned by another doctor', async () => {
    const otherSchedule = WeeklySchedule.create({
      doctorId: doctor2.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
    });
    await scheduleRepo.save(otherSchedule);

    await expect(
      recordCountUseCase.execute({
        doctorId: doctor1.id,
        scheduleId: otherSchedule.id,
        date: '2026-09-21',
        patientCount: 3,
      })
    ).rejects.toThrowError('Schedule does not belong to doctor');
  });

  it('should reject a schedule that does not match the calendar day', async () => {
    const mondaySchedule = (await scheduleRepo.findByDoctorId(doctor1.id))[0];

    await expect(
      recordCountUseCase.execute({
        doctorId: doctor1.id,
        scheduleId: mondaySchedule.id,
        date: '2026-09-22',
        patientCount: 3,
      })
    ).rejects.toThrowError('Schedule does not match date');
  });

  it('should preserve the recorded shift time when schedules later change', async () => {
    const originalSchedule = (await scheduleRepo.findByDoctorId(doctor1.id))[0];
    await recordCountUseCase.execute({
      doctorId: doctor1.id,
      scheduleId: originalSchedule.id,
      date: '2026-09-21',
      patientCount: 9,
    });

    await scheduleRepo.replaceDoctorSchedules(doctor1.id, [
      WeeklySchedule.create({
        doctorId: doctor1.id,
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '16:00',
      }),
    ]);

    const report = await reportDataUseCase.execute({
      startDate: '2026-09-21',
      endDate: '2026-09-21',
    });
    expect(report.doctors[0].dailyBreakdown[0].shiftTime).toBe('08:00 - 14:00');
  });

  it('should preserve the recorded shift time when the schedule is removed', async () => {
    const originalSchedule = (await scheduleRepo.findByDoctorId(doctor1.id))[0];
    await recordCountUseCase.execute({
      doctorId: doctor1.id,
      scheduleId: originalSchedule.id,
      date: '2026-09-21',
      patientCount: 7,
    });

    await scheduleRepo.replaceDoctorSchedules(doctor1.id, []);

    const report = await reportDataUseCase.execute({
      startDate: '2026-09-21',
      endDate: '2026-09-21',
    });
    expect(report.doctors[0].dailyBreakdown[0].shiftTime).toBe('08:00 - 14:00');
  });

  it('should identify legacy records without a shift snapshot', async () => {
    const originalSchedule = (await scheduleRepo.findByDoctorId(doctor1.id))[0];
    await countRepo.save(DailyPatientCount.create({
      doctorId: doctor1.id,
      scheduleId: originalSchedule.id,
      date: '2026-09-21',
      patientCount: 4,
    }));

    const report = await reportDataUseCase.execute({
      startDate: '2026-09-21',
      endDate: '2026-09-21',
    });
    expect(report.doctors[0].dailyBreakdown[0].shiftTime).toBe('Horario histórico no disponible');
  });

  it('should reject impossible dates and invalid report ranges', async () => {
    await expect(dailyOverviewUseCase.execute('2026-02-30')).rejects.toThrowError(
      'Date must be a valid calendar date'
    );
    await expect(
      reportDataUseCase.execute({ startDate: '2026-09-22', endDate: '2026-09-21' })
    ).rejects.toThrowError('Start date cannot be after end date');
  });

  it('should atomically keep one record per doctor, date, and slot', async () => {
    await Promise.all([
      recordCountUseCase.execute({
        doctorId: doctor1.id,
        date: '2026-09-21',
        patientCount: 11,
      }),
      recordCountUseCase.execute({
        doctorId: doctor1.id,
        date: '2026-09-21',
        patientCount: 22,
      }),
    ]);

    expect(countRepo.records.size).toBe(1);
    expect((await countRepo.findByDoctorAndDate(doctor1.id, '2026-09-21'))?.patientCount).toBe(22);
  });
});
