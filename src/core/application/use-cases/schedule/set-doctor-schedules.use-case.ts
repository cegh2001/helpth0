import { WeeklySchedule } from '@/core/domain/entities/schedule.entity';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';

export interface ScheduleItemDTO {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface SetDoctorSchedulesDTO {
  doctorId: string;
  schedules: ScheduleItemDTO[];
}

export interface ScheduleResponseDTO {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export class SetDoctorSchedulesUseCase {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly scheduleRepository: ScheduleRepository
  ) {}

  async execute(dto: SetDoctorSchedulesDTO): Promise<ScheduleResponseDTO[]> {
    const doctor = await this.doctorRepository.findById(dto.doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Validate no overlap within the same day
    const byDay = new Map<number, ScheduleItemDTO[]>();
    for (const item of dto.schedules) {
      const list = byDay.get(item.dayOfWeek) || [];
      for (const existing of list) {
        // Two time intervals [A, B] and [C, D] overlap if max(A, C) < min(B, D)
        const overlaps = Math.max(
          this.timeToMinutes(existing.startTime),
          this.timeToMinutes(item.startTime)
        ) < Math.min(
          this.timeToMinutes(existing.endTime),
          this.timeToMinutes(item.endTime)
        );

        if (overlaps) {
          throw new Error(`Overlapping schedule detected for day ${item.dayOfWeek}`);
        }
      }
      list.push(item);
      byDay.set(item.dayOfWeek, list);
    }

    const domainEntities = dto.schedules.map((s) =>
      WeeklySchedule.create({
        doctorId: dto.doctorId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })
    );

    await this.scheduleRepository.replaceDoctorSchedules(dto.doctorId, domainEntities);

    return domainEntities.map((e) => ({
      id: e.id,
      doctorId: e.doctorId,
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
    }));
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
