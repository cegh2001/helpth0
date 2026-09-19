import { WeeklySchedule } from '@/core/domain/entities/schedule.entity';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';

export class InMemoryScheduleRepository implements ScheduleRepository {
  public schedules: Map<string, WeeklySchedule> = new Map();

  async save(schedule: WeeklySchedule): Promise<void> {
    this.schedules.set(schedule.id, schedule);
  }

  async findById(id: string): Promise<WeeklySchedule | null> {
    return this.schedules.get(id) || null;
  }

  async findByDoctorId(doctorId: string): Promise<WeeklySchedule[]> {
    return Array.from(this.schedules.values()).filter((s) => s.doctorId === doctorId);
  }

  async findByDayOfWeek(dayOfWeek: number): Promise<WeeklySchedule[]> {
    return Array.from(this.schedules.values()).filter((s) => s.dayOfWeek === dayOfWeek);
  }

  async delete(id: string): Promise<void> {
    this.schedules.delete(id);
  }

  async replaceDoctorSchedules(doctorId: string, newSchedules: WeeklySchedule[]): Promise<void> {
    for (const [id, sched] of Array.from(this.schedules.entries())) {
      if (sched.doctorId === doctorId) {
        this.schedules.delete(id);
      }
    }
    for (const sched of newSchedules) {
      this.schedules.set(sched.id, sched);
    }
  }
}
