import { TherapySession } from '@/core/domain/entities/therapy-session.entity';

export interface ParseTherapyRowError {
  rowNumber: number;
  message: string;
}

export interface ParseTherapiesSummary {
  totalParsed: number;
  totalAmountUsd: number;
  totalAmountBs: number;
  totalExoneratedUsd: number;
  exoneratedSessionsCount: number;
  averageBcvRate: number;
  minBcvRate: number;
  maxBcvRate: number;
  uniqueTherapists: string[];
  uniqueSpecialties: string[];
  dateRange: { min: string; max: string } | null;
}

export interface ParseTherapiesResult {
  sessions: TherapySession[];
  errors: ParseTherapyRowError[];
  summary: ParseTherapiesSummary;
}

export interface TherapyParserPort {
  parseFromCsv(csvText: string): ParseTherapiesResult;
  parseFromBuffer(buffer: Buffer): Promise<ParseTherapiesResult>;
}
