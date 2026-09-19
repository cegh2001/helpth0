import { WeeklySchedule } from '@/core/domain/entities/schedule.entity';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';
import { timeToMinutes } from '@/core/domain/validation/time-range';

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

    const currentSchedules = await this.scheduleRepository.findByDoctorId(dto.doctorId);
    const domainEntities = dto.schedules.map((schedule) => {
      const unchangedSchedule = currentSchedules.find((current) =>
        current.dayOfWeek === schedule.dayOfWeek
        && current.startTime === schedule.startTime
        && current.endTime === schedule.endTime
      );

      return unchangedSchedule ?? WeeklySchedule.create({
        doctorId: dto.doctorId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
    });

    for (let currentIndex = 0; currentIndex < domainEntities.length; currentIndex += 1) {
      for (let previousIndex = 0; previousIndex < currentIndex; previousIndex += 1) {
        if (this.overlapsInWeeklyCycle(domainEntities[previousIndex], domainEntities[currentIndex])) {
          throw new Error(
            `Overlapping schedule detected for day ${domainEntities[currentIndex].dayOfWeek}`
          );
        }
      }
    }

    await this.scheduleRepository.replaceDoctorSchedules(dto.doctorId, domainEntities);

    return domainEntities.map((e) => ({
      id: e.id,
      doctorId: e.doctorId,
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
    }));
  }

  private overlapsInWeeklyCycle(first: WeeklySchedule, second: WeeklySchedule): boolean {
    const weekMinutes = 7 * 24 * 60;
    const firstStart = first.dayOfWeek * 24 * 60 + timeToMinutes(first.startTime);
    const firstEnd = first.dayOfWeek * 24 * 60 + timeToMinutes(first.endTime)
      + (first.endTime < first.startTime ? 24 * 60 : 0);
    const secondStart = second.dayOfWeek * 24 * 60 + timeToMinutes(second.startTime);
    const secondEnd = second.dayOfWeek * 24 * 60 + timeToMinutes(second.endTime)
      + (second.endTime < second.startTime ? 24 * 60 : 0);

    return [-weekMinutes, 0, weekMinutes].some((offset) =>
      Math.max(firstStart, secondStart + offset) < Math.min(firstEnd, secondEnd + offset)
    );
  }
}
