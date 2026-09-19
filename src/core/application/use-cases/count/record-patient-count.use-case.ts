import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';
import {
  assertValidCalendarDate,
  getCalendarDayOfWeek,
} from '@/core/domain/validation/calendar-date';

export interface RecordPatientCountDTO {
  doctorId: string;
  scheduleId?: string | null;
  date: string; // YYYY-MM-DD
  patientCount: number;
}

export interface PatientCountResponseDTO {
  id: string;
  doctorId: string;
  scheduleId: string | null;
  date: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export class RecordPatientCountUseCase {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly countRepository: DailyCountRepository
  ) {}

  async execute(dto: RecordPatientCountDTO): Promise<PatientCountResponseDTO> {
    assertValidCalendarDate(dto.date);

    const doctor = await this.doctorRepository.findById(dto.doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    let scheduleStartTime: string | null = null;
    let scheduleEndTime: string | null = null;
    if (dto.scheduleId) {
      const schedule = await this.scheduleRepository.findById(dto.scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      if (schedule.doctorId !== dto.doctorId) {
        throw new Error('Schedule does not belong to doctor');
      }
      if (schedule.dayOfWeek !== getCalendarDayOfWeek(dto.date)) {
        throw new Error('Schedule does not match date');
      }
      scheduleStartTime = schedule.startTime;
      scheduleEndTime = schedule.endTime;
    }

    const record = await this.countRepository.save(DailyPatientCount.create({
      doctorId: dto.doctorId,
      scheduleId: dto.scheduleId ?? null,
      scheduleStartTime,
      scheduleEndTime,
      date: dto.date,
      patientCount: dto.patientCount,
    }));

    return {
      id: record.id,
      doctorId: record.doctorId,
      scheduleId: record.scheduleId,
      date: record.date,
      patientCount: record.patientCount,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
