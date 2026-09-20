import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@/generated/prisma/client';
import { WeeklySchedule } from '@/core/domain/entities/schedule.entity';
import { PrismaScheduleRepository } from '@/infrastructure/persistence/repositories/prisma-schedule.repository';

function createRepository() {
  const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const findMany = vi.fn().mockResolvedValue([]);
  const upsert = vi.fn().mockResolvedValue({});
  const updateMany = vi.fn().mockResolvedValue({ count: 0 });
  const transaction = vi.fn(async (operation) => operation({
    schedule: { deleteMany, findMany, upsert },
    dailyCount: { updateMany },
  }));
  const prisma = { $transaction: transaction } as unknown as PrismaClient;

  return {
    repository: new PrismaScheduleRepository(prisma),
    deleteMany,
    findMany,
    upsert,
    updateMany,
  };
}

describe('PrismaScheduleRepository', () => {
  it('deletes only retired schedules and upserts desired schedules', async () => {
    const { repository, deleteMany, upsert } = createRepository();
    const schedule = WeeklySchedule.create({
      id: 'schedule-stable',
      doctorId: 'doctor-1',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '12:00',
    });

    await repository.replaceDoctorSchedules('doctor-1', [schedule]);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        doctorId: 'doctor-1',
        id: { notIn: ['schedule-stable'] },
      },
    });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'schedule-stable' },
    }));
  });

  it('deletes all doctor schedules when the desired list is empty', async () => {
    const { repository, deleteMany, upsert } = createRepository();

    await repository.replaceDoctorSchedules('doctor-1', []);

    expect(deleteMany).toHaveBeenCalledWith({ where: { doctorId: 'doctor-1' } });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('snapshots linked legacy counts before deleting a retired schedule', async () => {
    const { repository, findMany, updateMany, deleteMany } = createRepository();
    findMany.mockResolvedValue([
      {
        id: 'retired-schedule',
        startTime: '08:00',
        endTime: '14:00',
      },
    ]);

    await repository.replaceDoctorSchedules('doctor-1', []);

    expect(findMany).toHaveBeenCalledWith({
      where: { doctorId: 'doctor-1' },
      select: { id: true, startTime: true, endTime: true },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        scheduleId: 'retired-schedule',
        scheduleSnapshotStart: null,
        scheduleSnapshotEnd: null,
      },
      data: {
        scheduleSnapshotStart: '08:00',
        scheduleSnapshotEnd: '14:00',
      },
    });
    expect(updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      deleteMany.mock.invocationCallOrder[0]
    );
  });
});