import { WeeklySchedule } from '../entities/schedule.entity';

export interface ScheduleRepository {
  save(schedule: WeeklySchedule): Promise<void>;
  findById(id: string): Promise<WeeklySchedule | null>;
  findByDoctorId(doctorId: string): Promise<WeeklySchedule[]>;
  findByDayOfWeek(dayOfWeek: number): Promise<WeeklySchedule[]>;
  delete(id: string): Promise<void>;
  replaceDoctorSchedules(doctorId: string, schedules: WeeklySchedule[]): Promise<void>;
}
