import { Consultation } from '@/core/domain/entities/consultation.entity';

export interface ConsultationFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
  specialty?: string;
  doctorName?: string;
  status?: string;
}

export interface ConsultationRepository {
  findByImportHash(importHash: string): Promise<Consultation | null>;
  findMany(filter?: ConsultationFilter): Promise<Consultation[]>;
  save(consultation: Consultation): Promise<Consultation>;
  saveMany(consultations: Consultation[]): Promise<{
    inserted: number;
    skipped: number;
    items: Consultation[];
  }>;
}
