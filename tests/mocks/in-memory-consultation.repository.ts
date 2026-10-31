import { Consultation } from '@/core/domain/entities/consultation.entity';
import {
  ConsultationFilter,
  ConsultationRepository,
} from '@/core/domain/repositories/consultation.repository';

export class InMemoryConsultationRepository implements ConsultationRepository {
  private items: Map<string, Consultation> = new Map();

  async findByImportHash(importHash: string): Promise<Consultation | null> {
    for (const c of this.items.values()) {
      if (c.importHash === importHash) return c;
    }
    return null;
  }

  async findMany(filter?: ConsultationFilter): Promise<Consultation[]> {
    let result = Array.from(this.items.values());

    if (filter?.date) {
      result = result.filter((c) => c.date === filter.date);
    }
    if (filter?.startDate && filter?.endDate) {
      result = result.filter((c) => c.date >= filter.startDate! && c.date <= filter.endDate!);
    }
    if (filter?.specialty) {
      result = result.filter((c) => c.specialty.toLowerCase() === filter.specialty!.toLowerCase());
    }
    if (filter?.doctorName) {
      result = result.filter((c) => c.doctorName.toLowerCase() === filter.doctorName!.toLowerCase());
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async save(consultation: Consultation): Promise<Consultation> {
    this.items.set(consultation.importHash, consultation);
    return consultation;
  }

  async saveMany(consultations: Consultation[]): Promise<{
    inserted: number;
    skipped: number;
    items: Consultation[];
  }> {
    let inserted = 0;
    let skipped = 0;

    for (const c of consultations) {
      if (this.items.has(c.importHash)) {
        skipped++;
      } else {
        this.items.set(c.importHash, c);
        inserted++;
      }
    }

    return {
      inserted,
      skipped,
      items: Array.from(this.items.values()),
    };
  }

  clear(): void {
    this.items.clear();
  }
}
