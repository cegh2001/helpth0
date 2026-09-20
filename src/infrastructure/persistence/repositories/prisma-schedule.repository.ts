import { PrismaClient } from '@/generated/prisma/client';
import { WeeklySchedule } from '@/core/domain/entities/schedule.entity';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';

export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(schedule: WeeklySchedule): Promise<void> {
    await this.prisma.schedule.upsert({
      where: { id: schedule.id },
      create: {
        id: schedule.id,
        doctorId: schedule.doctorId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      },
      update: {
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        updatedAt: schedule.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<WeeklySchedule | null> {
    const raw = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return WeeklySchedule.create({
      id: raw.id,
      doctorId: raw.doctorId,
      dayOfWeek: raw.dayOfWeek,
      startTime: raw.startTime,
      endTime: raw.endTime,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findByDoctorId(doctorId: string): Promise<WeeklySchedule[]> {
    const records = await this.prisma.schedule.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return records.map((r) =>
      WeeklySchedule.create({
        id: r.id,
        doctorId: r.doctorId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }

  async findByDayOfWeek(dayOfWeek: number): Promise<WeeklySchedule[]> {
    const records = await this.prisma.schedule.findMany({
      where: { dayOfWeek },
      orderBy: { startTime: 'asc' },
    });

    return records.map((r) =>
      WeeklySchedule.create({
        id: r.id,
        doctorId: r.doctorId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.schedule.delete({
      where: { id },
    });
  }

  async replaceDoctorSchedules(doctorId: string, schedules: WeeklySchedule[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const desiredIds = schedules.map((schedule) => schedule.id);
      const currentSchedules = await tx.schedule.findMany({
        where: { doctorId },
        select: { id: true, startTime: true, endTime: true },
      });
      const retiredSchedules = currentSchedules.filter(
        (schedule) => !desiredIds.includes(schedule.id)
      );

      await Promise.all(retiredSchedules.map((schedule) => tx.dailyCount.updateMany({
        where: {
          scheduleId: schedule.id,
          scheduleSnapshotStart: null,
          scheduleSnapshotEnd: null,
        },
        data: {
          scheduleSnapshotStart: schedule.startTime,
          scheduleSnapshotEnd: schedule.endTime,
        },
      })));

      await tx.schedule.deleteMany({
        where: desiredIds.length > 0
          ? { doctorId, id: { notIn: desiredIds } }
          : { doctorId },
      });

      await Promise.all(schedules.map((schedule) => tx.schedule.upsert({
        where: { id: schedule.id },
        create: {
          id: schedule.id,
          doctorId: schedule.doctorId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
        },
        update: {
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          updatedAt: schedule.updatedAt,
        },
      })));
    });
  }
}
