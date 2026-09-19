import { PrismaClient } from '@prisma/client';
import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';

export class PrismaDailyCountRepository implements DailyCountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(count: DailyPatientCount): Promise<void> {
    await this.prisma.dailyCount.upsert({
      where: {
        doctorId_date: {
          doctorId: count.doctorId,
          date: count.date,
        },
      },
      create: {
        id: count.id,
        doctorId: count.doctorId,
        date: count.date,
        patientCount: count.patientCount,
        notes: count.notes,
        createdAt: count.createdAt,
        updatedAt: count.updatedAt,
      },
      update: {
        patientCount: count.patientCount,
        notes: count.notes,
        updatedAt: count.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<DailyPatientCount | null> {
    const raw = await this.prisma.dailyCount.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return DailyPatientCount.create({
      id: raw.id,
      doctorId: raw.doctorId,
      date: raw.date,
      patientCount: raw.patientCount,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findByDoctorAndDate(doctorId: string, date: string): Promise<DailyPatientCount | null> {
    const raw = await this.prisma.dailyCount.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date,
        },
      },
    });

    if (!raw) return null;

    return DailyPatientCount.create({
      id: raw.id,
      doctorId: raw.doctorId,
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
        date: r.date,
        patientCount: r.patientCount,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }
}
