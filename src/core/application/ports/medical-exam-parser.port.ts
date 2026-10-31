import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';

export interface ParseMedicalExamRowError {
  rowNumber: number;
  message: string;
}

export interface ParseMedicalExamsSummary {
  totalParsed: number;
  totalAmountUsd: number;
  totalAmountBs: number;
  totalExoneratedUsd: number;
  exoneratedPatientsCount: number;
  averageBcvRate: number;
  minBcvRate: number;
  maxBcvRate: number;
  dateRange: { min: string; max: string } | null;
}

export interface ParseMedicalExamsResult {
  exams: MedicalExam[];
  errors: ParseMedicalExamRowError[];
  summary: ParseMedicalExamsSummary;
}

export interface MedicalExamParserPort {
  parseFromCsv(csvText: string): ParseMedicalExamsResult;
  parseFromBuffer(buffer: Buffer): Promise<ParseMedicalExamsResult>;
}
