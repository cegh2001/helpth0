import { PrismaClient } from '@/generated/prisma/client';
import { TherapySession } from '@/core/domain/entities/therapy-session.entity';
import {
  TherapyFilter,
  TherapyRepository,
  TherapySaveManyResult,
} from '@/core/domain/repositories/therapy.repository';

interface TherapySessionRecord {
  id: string;
  date: string;
  therapistName: string;
  specialty: string;
  dayOfWeekName: string;
  sessionIndex: number;
  amountPointBs: number;
  amountMobileBs: number;
  amountCashBs: number;
  bcvRate: number;
  amountUsd: number;
  totalBs: number;
  status: string;
  exonerationPercent: number;
  exoneratedAmountUsd: number;
  observations: string | null;
  importHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaTherapyRepository implements TherapyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByImportHash(importHash: string): Promise<TherapySession | null> {
    const raw = await this.prisma.therapySession.findUnique({
      where: { importHash },
    });

    return raw ? this.toDomain(raw) : null;
  }

  async findMany(filter?: TherapyFilter): Promise<TherapySession[]> {
    const where: Record<string, unknown> = {};

    if (filter?.date) {
      where.date = filter.date;
    } else if (filter?.startDate && filter?.endDate) {
      where.date = { gte: filter.startDate, lte: filter.endDate };
    }

    if (filter?.therapistName) {
      where.therapistName = { equals: filter.therapistName, mode: 'insensitive' };
    }

    if (filter?.specialty) {
      where.specialty = { equals: filter.specialty, mode: 'insensitive' };
    }

    if (filter?.status) {
      where.status = { equals: filter.status, mode: 'insensitive' };
    }

    if (filter?.searchQuery) {
      const query = filter.searchQuery.trim();
      where.OR = [
        { therapistName: { contains: query, mode: 'insensitive' } },
        { specialty: { contains: query, mode: 'insensitive' } },
        { observations: { contains: query, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.therapySession.findMany({
      where,
      orderBy: [{ date: 'asc' }, { therapistName: 'asc' }, { sessionIndex: 'asc' }],
    });

    return records.map((record) => this.toDomain(record));
  }

  async save(session: TherapySession): Promise<TherapySession> {
    const values = {
      date: session.date,
      therapistName: session.therapistName,
      specialty: session.specialty,
      dayOfWeekName: session.dayOfWeekName,
      sessionIndex: session.sessionIndex,
      amountPointBs: session.amountPointBs,
      amountMobileBs: session.amountMobileBs,
      amountCashBs: session.amountCashBs,
      bcvRate: session.bcvRate,
      amountUsd: session.amountUsd,
      totalBs: session.totalBs,
      status: session.status,
      exonerationPercent: session.exonerationPercent,
      exoneratedAmountUsd: session.exoneratedAmountUsd,
      observations: session.observations,
    };

    const raw = await this.prisma.therapySession.upsert({
      where: { importHash: session.importHash },
      create: { id: session.id, ...values, importHash: session.importHash },
      update: values,
    });

    return this.toDomain(raw);
  }

  async saveMany(sessions: TherapySession[]): Promise<TherapySaveManyResult> {
    if (sessions.length === 0) {
      return { inserted: 0, skipped: 0, items: [] };
    }

    const hashes = sessions.map((session) => session.importHash);
    const existing = await this.prisma.therapySession.findMany({
      where: { importHash: { in: hashes } },
      select: { importHash: true },
    });

    const existingSet = new Set(existing.map((record) => record.importHash));
    const batchSeen = new Set<string>();
    const uniqueBatch: TherapySession[] = [];
    let intraBatchDuplicates = 0;

    for (const session of sessions) {
      if (batchSeen.has(session.importHash)) {
        intraBatchDuplicates++;
      } else {
        batchSeen.add(session.importHash);
        uniqueBatch.push(session);
      }
    }

    const newRowsCount = uniqueBatch.filter(
      (session) => !existingSet.has(session.importHash)
    ).length;

    for (const session of uniqueBatch) {
      await this.save(session);
    }

    const dates = sessions.map((session) => session.date).sort();
    const allSaved = await this.findMany({
      startDate: dates[0],
      endDate: dates[dates.length - 1],
    });

    return {
      inserted: newRowsCount,
      skipped: intraBatchDuplicates,
      items: allSaved,
    };
  }

  private toDomain(raw: TherapySessionRecord): TherapySession {
    return TherapySession.reconstruct({
      id: raw.id,
      date: raw.date,
      therapistName: raw.therapistName,
      specialty: raw.specialty,
      sessionIndex: raw.sessionIndex,
      amountPointBs: raw.amountPointBs,
      amountMobileBs: raw.amountMobileBs,
      amountCashBs: raw.amountCashBs,
      bcvRate: raw.bcvRate,
      amountUsd: raw.amountUsd,
      totalBs: raw.totalBs,
      status: raw.status,
      exonerationPercent: raw.exonerationPercent,
      exoneratedAmountUsd: raw.exoneratedAmountUsd,
      observations: raw.observations,
      importHash: raw.importHash,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
