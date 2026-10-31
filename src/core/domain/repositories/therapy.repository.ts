import { TherapySession } from '@/core/domain/entities/therapy-session.entity';

export interface TherapyFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
  therapistName?: string;
  specialty?: string;
  status?: string;
  searchQuery?: string;
}

export interface TherapySaveManyResult {
  inserted: number;
  skipped: number;
  items: TherapySession[];
}

export interface TherapyRepository {
  findByImportHash(importHash: string): Promise<TherapySession | null>;
  findMany(filter?: TherapyFilter): Promise<TherapySession[]>;
  save(session: TherapySession): Promise<TherapySession>;
  saveMany(sessions: TherapySession[]): Promise<TherapySaveManyResult>;
}
