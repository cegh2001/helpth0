import { Consultation } from '@/core/domain/entities/consultation.entity';

export interface ParseConsultationRowError {
  rowNumber: number;
  message: string;
}

export interface ParseConsultationsSummary {
  totalParsed: number;
  totalAmountUsd: number;
  totalAmountBs: number;
  uniqueDoctors: string[];
  uniqueSpecialties: string[];
  dateRange: { min: string; max: string } | null;
}

export interface ParseConsultationsResult {
  consultations: Consultation[];
  errors: ParseConsultationRowError[];
  summary: ParseConsultationsSummary;
}

export interface ConsultationParserPort {
  parseFromCsv(csvText: string): ParseConsultationsResult;
  parseFromBuffer(buffer: Buffer): Promise<ParseConsultationsResult>;
}
