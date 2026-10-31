import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';
import {
  MedicalExamFilter,
  MedicalExamRepository,
} from '@/core/domain/repositories/medical-exam.repository';

export class InMemoryMedicalExamRepository implements MedicalExamRepository {
  private items: Map<string, MedicalExam> = new Map();

  async findByImportHash(importHash: string): Promise<MedicalExam | null> {
    for (const item of this.items.values()) {
      if (item.importHash === importHash) return item;
    }
    return null;
  }

  async findMany(filter?: MedicalExamFilter): Promise<MedicalExam[]> {
    let result = Array.from(this.items.values());

    if (filter?.date) {
      result = result.filter((item) => item.date === filter.date);
    }
    if (filter?.startDate && filter?.endDate) {
      result = result.filter((item) => item.date >= filter.startDate! && item.date <= filter.endDate!);
    }
    if (filter?.status) {
      result = result.filter((item) => item.status.toLowerCase() === filter.status!.toLowerCase());
    }
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.patientName.toLowerCase().includes(q) ||
          (item.patientCedula && item.patientCedula.includes(q)) ||
          (item.examName && item.examName.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async save(exam: MedicalExam): Promise<MedicalExam> {
    this.items.set(exam.importHash, exam);
    return exam;
  }

  async saveMany(exams: MedicalExam[]): Promise<{
    inserted: number;
    skipped: number;
    items: MedicalExam[];
  }> {
    let inserted = 0;
    let skipped = 0;

    for (const item of exams) {
      if (this.items.has(item.importHash)) {
        skipped++;
      } else {
        this.items.set(item.importHash, item);
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
