import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';

export interface MedicalExamFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  searchQuery?: string;
}

export interface MedicalExamRepository {
  findByImportHash(importHash: string): Promise<MedicalExam | null>;
  findMany(filter?: MedicalExamFilter): Promise<MedicalExam[]>;
  save(exam: MedicalExam): Promise<MedicalExam>;
  saveMany(exams: MedicalExam[]): Promise<{
    inserted: number;
    skipped: number;
    items: MedicalExam[];
  }>;
}
