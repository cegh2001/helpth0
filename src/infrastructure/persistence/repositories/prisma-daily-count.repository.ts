import { PrismaClient } from '@prisma/client';
import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';

export class PrismaDailyCountRepository implements DailyCountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(count: DailyPatientCount): Promise<void> {
    const existing = await this.prisma.dailyCount.findFirst({
      where: {
        doctorId: count.doctorId,
        date: count.date,
        scheduleId: count.scheduleId || null,
      },
    });

    if (existing) {
      await this.prisma.dailyCount.update({
        where: { id: existing.id },
        data: {
          patientCount: count.patientCount,
          notes: count.notes,
          updatedAt: count.updatedAt,
        },
      });
    } else {
      await this.prisma.dailyCount.create({
        data: {
          id: count.id,
          doctorId: count.doctorId,
          scheduleId: count.scheduleId || null,
          date: count.date,
          patientCount: count.patientCount,
          notes: count.notes,
          createdAt: count.createdAt,
          updatedAt: count.updatedAt,
        },
      });
    }
  }

  async findById(id: string): Promise<DailyPatientCount | null> {
    const raw = await this.prisma.dailyCount.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return DailyPatientCount.create({
      id: raw.id,
      doctorId: raw.doctorId,
      scheduleId: raw.scheduleId,
      date: raw.date,
      patientCount: raw.patientCount,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findByDoctorAndDate(doctorId: string, date: string): Promise<DailyPatientCount | null> {
    const raw = await this.prisma.dailyCount.findFirst({
      where: {
        doctorId,
        date,
      },
    });

    if (!raw) return null;

    return DailyPatientCount.create({
      id: raw.id,
      doctorId: raw.doctorId,
      scheduleId: raw.scheduleId,
      date: raw.date,
      patientCount: raw.patientCount,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findByDoctorDateAndSchedule(
    doctorId: string,
    date: string,
    scheduleId?: string | null
  ): Promise<DailyPatientCount | null> {
    const raw = await this.prisma.dailyCount.findFirst({
      where: {
        doctorId,
        date,
        scheduleId: scheduleId || null,
      },
    });

    if (!raw) return null;

    return DailyPatientCount.create({
      id: raw.id,
      doctorId: raw.doctorId,
      scheduleId: raw.scheduleId,
      date: raw.date,
      patientCount: raw.patientCount,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findByDate(date: string): Promise<DailyPatientCount[]> {
    const records = await this.prisma.dailyCount.findMany({
      where: { date },
    });

    return records.map((r) =>
      DailyPatientCount.create({
        id: r.id,
        doctorId: r.doctorId,
        scheduleId: r.scheduleId,
        date: r.date,
        patientCount: r.patientCount,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }

  async findByDateRange(startDate: string, endDate: string): Promise<DailyPatientCount[]> {
    const records = await this.prisma.dailyCount.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return records.map((r) =>
      DailyPatientCount.create({
        id: r.id,
        doctorId: r.doctorId,
        scheduleId: r.scheduleId,
        date: r.date,
        patientCount: r.patientCount,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }
}
