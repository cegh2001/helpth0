import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';
import { PrismaDailyCountRepository } from '@/infrastructure/persistence/repositories/prisma-daily-count.repository';

describe('PrismaDailyCountRepository', () => {
  it('uses one atomic upsert for a nullable schedule slot', async () => {
    const now = new Date('2026-09-19T12:00:00.000Z');
    const upsert = vi.fn().mockResolvedValue({
      id: 'count-1',
      doctorId: 'doctor-1',
      scheduleId: null,
      slotKey: '',
      scheduleSnapshotStart: null,
      scheduleSnapshotEnd: null,
      date: '2026-09-19',
      patientCount: 22,
      createdAt: now,
      updatedAt: now,
    });
    const findFirst = vi.fn();
    const prisma = { dailyCount: { upsert, findFirst } } as unknown as PrismaClient;
    const repository = new PrismaDailyCountRepository(prisma);

    const saved = await repository.save(DailyPatientCount.create({
      id: 'count-1',
      doctorId: 'doctor-1',
      date: '2026-09-19',
      patientCount: 22,
      createdAt: now,
      updatedAt: now,
    }));

    expect(findFirst).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        doctorId_date_slotKey: {
          doctorId: 'doctor-1',
          date: '2026-09-19',
          slotKey: '',
        },
      },
    }));
    expect(saved.id).toBe('count-1');
  });
});