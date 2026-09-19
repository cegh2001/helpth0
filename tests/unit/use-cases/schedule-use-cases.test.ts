import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDoctorRepository } from '../../mocks/in-memory-doctor.repository';
import { InMemoryScheduleRepository } from '../../mocks/in-memory-schedule.repository';
import { Doctor } from '@/core/domain/entities/doctor.entity';
import { SetDoctorSchedulesUseCase } from '@/core/application/use-cases/schedule/set-doctor-schedules.use-case';
import { GetDoctorSchedulesUseCase } from '@/core/application/use-cases/schedule/get-doctor-schedules.use-case';

describe('Schedule Use Cases', () => {
  let doctorRepo: InMemoryDoctorRepository;
  let scheduleRepo: InMemoryScheduleRepository;
  let setSchedulesUseCase: SetDoctorSchedulesUseCase;
  let getSchedulesUseCase: GetDoctorSchedulesUseCase;
  let sampleDoctor: Doctor;

  beforeEach(async () => {
    doctorRepo = new InMemoryDoctorRepository();
    scheduleRepo = new InMemoryScheduleRepository();
    setSchedulesUseCase = new SetDoctorSchedulesUseCase(doctorRepo, scheduleRepo);
    getSchedulesUseCase = new GetDoctorSchedulesUseCase(doctorRepo, scheduleRepo);

    sampleDoctor = Doctor.create({ name: 'Dr. House', specialty: 'Diagnostics' });
    await doctorRepo.save(sampleDoctor);
  });

  it('should set schedules for an existing doctor', async () => {
    const schedules = [
      { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
    ];

    const result = await setSchedulesUseCase.execute({
      doctorId: sampleDoctor.id,
      schedules,
    });

    expect(result.length).toBe(2);
    expect(result[0].dayOfWeek).toBe(1);
    expect(result[1].dayOfWeek).toBe(3);

    const saved = await getSchedulesUseCase.execute(sampleDoctor.id);
    expect(saved.length).toBe(2);
  });

  it('should preserve the id of an unchanged schedule', async () => {
    const schedule = { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' };
    const initial = await setSchedulesUseCase.execute({
      doctorId: sampleDoctor.id,
      schedules: [schedule],
    });

    const replacement = await setSchedulesUseCase.execute({
      doctorId: sampleDoctor.id,
      schedules: [schedule],
    });

    expect(replacement[0].id).toBe(initial[0].id);
    expect(await scheduleRepo.findById(initial[0].id)).not.toBeNull();
  });

  it('should reject schedule assignment for non-existent doctor', async () => {
    await expect(
      setSchedulesUseCase.execute({
        doctorId: 'non-existent-id',
        schedules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }],
      })
    ).rejects.toThrowError('Doctor not found');
  });

  it('should reject overlapping schedules for the same doctor on the same day', async () => {
    const overlapping = [
      { dayOfWeek: 2, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 2, startTime: '11:00', endTime: '15:00' },
    ];

    await expect(
      setSchedulesUseCase.execute({
        doctorId: sampleDoctor.id,
        schedules: overlapping,
      })
    ).rejects.toThrowError('Overlapping schedule detected for day 2');
  });

  it('should reject overlap between an overnight shift and the next day', async () => {
    await expect(
      setSchedulesUseCase.execute({
        doctorId: sampleDoctor.id,
        schedules: [
          { dayOfWeek: 1, startTime: '22:00', endTime: '06:00' },
          { dayOfWeek: 2, startTime: '05:30', endTime: '09:00' },
        ],
      })
    ).rejects.toThrowError('Overlapping schedule detected');
  });

  it('should allow adjacent overnight and next-day shifts', async () => {
    const result = await setSchedulesUseCase.execute({
      doctorId: sampleDoctor.id,
      schedules: [
        { dayOfWeek: 1, startTime: '22:00', endTime: '06:00' },
        { dayOfWeek: 2, startTime: '06:00', endTime: '09:00' },
      ],
    });

    expect(result).toHaveLength(2);
  });

  it('should detect Sunday overnight overlap with Monday', async () => {
    await expect(
      setSchedulesUseCase.execute({
        doctorId: sampleDoctor.id,
        schedules: [
          { dayOfWeek: 0, startTime: '23:00', endTime: '02:00' },
          { dayOfWeek: 1, startTime: '01:00', endTime: '04:00' },
        ],
      })
    ).rejects.toThrowError('Overlapping schedule detected');
  });
});
