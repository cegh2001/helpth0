import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';
import { ScheduleResponseDTO } from './set-doctor-schedules.use-case';

export class GetDoctorSchedulesUseCase {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly scheduleRepository: ScheduleRepository
  ) {}

  async execute(doctorId: string): Promise<ScheduleResponseDTO[]> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const schedules = await this.scheduleRepository.findByDoctorId(doctorId);

    // Sort by dayOfWeek, then startTime
    return schedules
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
      .map((s) => ({
        id: s.id,
        doctorId: s.doctorId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
  }
}
