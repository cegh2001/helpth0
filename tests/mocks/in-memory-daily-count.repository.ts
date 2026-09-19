import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';

export class InMemoryDailyCountRepository implements DailyCountRepository {
  public records: Map<string, DailyPatientCount> = new Map();

  async save(count: DailyPatientCount): Promise<void> {
    this.records.set(count.id, count);
  }

  async findById(id: string): Promise<DailyPatientCount | null> {
    return this.records.get(id) || null;
  }

  async findByDoctorAndDate(doctorId: string, date: string): Promise<DailyPatientCount | null> {
    for (const record of this.records.values()) {
      if (record.doctorId === doctorId && record.date === date) {
        return record;
      }
    }
    return null;
  }

  async findByDate(date: string): Promise<DailyPatientCount[]> {
    return Array.from(this.records.values()).filter((r) => r.date === date);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<DailyPatientCount[]> {
    return Array.from(this.records.values()).filter((r) => r.date >= startDate && r.date <= endDate);
  }
}
