import { TherapySession } from '@/core/domain/entities/therapy-session.entity';
import {
  TherapyFilter,
  TherapyRepository,
  TherapySaveManyResult,
} from '@/core/domain/repositories/therapy.repository';

export class InMemoryTherapyRepository implements TherapyRepository {
  private items: Map<string, TherapySession> = new Map();

  async findByImportHash(importHash: string): Promise<TherapySession | null> {
    return this.items.get(importHash) ?? null;
  }

  async findMany(filter?: TherapyFilter): Promise<TherapySession[]> {
    let result = Array.from(this.items.values());

    if (filter?.date) {
      result = result.filter((item) => item.date === filter.date);
    }
    if (filter?.startDate && filter?.endDate) {
      result = result.filter(
        (item) => item.date >= filter.startDate! && item.date <= filter.endDate!
      );
    }
    if (filter?.therapistName) {
      const expected = filter.therapistName.toLowerCase();
      result = result.filter((item) => item.therapistName.toLowerCase() === expected);
    }
    if (filter?.specialty) {
      const expected = filter.specialty.toLowerCase();
      result = result.filter((item) => item.specialty.toLowerCase() === expected);
    }
    if (filter?.status) {
      const expected = filter.status.toLowerCase();
      result = result.filter((item) => item.status.toLowerCase() === expected);
    }
    if (filter?.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.therapistName.toLowerCase().includes(query) ||
          item.specialty.toLowerCase().includes(query) ||
          (item.observations?.toLowerCase().includes(query) ?? false)
      );
    }

    return result.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.therapistName.localeCompare(b.therapistName) ||
        a.sessionIndex - b.sessionIndex
    );
  }

  async save(session: TherapySession): Promise<TherapySession> {
    this.items.set(session.importHash, session);
    return session;
  }

  async saveMany(sessions: TherapySession[]): Promise<TherapySaveManyResult> {
    let inserted = 0;
    let skipped = 0;

    for (const session of sessions) {
      if (this.items.has(session.importHash)) {
        skipped++;
      } else {
        this.items.set(session.importHash, session);
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
