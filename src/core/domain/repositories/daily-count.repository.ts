import { DailyPatientCount } from '../entities/daily-count.entity';

export interface DailyCountRepository {
  save(count: DailyPatientCount): Promise<DailyPatientCount>;
  findById(id: string): Promise<DailyPatientCount | null>;
  findByDoctorAndDate(doctorId: string, date: string): Promise<DailyPatientCount | null>;
  findByDoctorDateAndSchedule(
    doctorId: string,
    date: string,
    scheduleId?: string | null
  ): Promise<DailyPatientCount | null>;
  findByDate(date: string): Promise<DailyPatientCount[]>;
  findByDateRange(startDate: string, endDate: string): Promise<DailyPatientCount[]>;
}
