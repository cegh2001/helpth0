import { PrismaClient } from '@prisma/client';
import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';

export class PrismaDailyCountRepository implements DailyCountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(count: DailyPatientCount): Promise<DailyPatientCount> {
    const slotKey = count.scheduleId ?? '';
    const raw = await this.prisma.dailyCount.upsert({
      where: {
        doctorId_date_slotKey: {
          doctorId: count.doctorId,
          date: count.date,
          slotKey,
        },
      },
      create: {
        id: count.id,
        doctorId: count.doctorId,
        scheduleId: count.scheduleId,
        slotKey,
        scheduleSnapshotStart: count.scheduleStartTime,
        scheduleSnapshotEnd: count.scheduleEndTime,
        date: count.date,
        patientCount: count.patientCount,
        createdAt: count.createdAt,
        updatedAt: count.updatedAt,
      },
      update: {
        scheduleId: count.scheduleId,
        scheduleSnapshotStart: count.scheduleStartTime,
        scheduleSnapshotEnd: count.scheduleEndTime,
        patientCount: count.patientCount,
        updatedAt: count.updatedAt,
      },
    });

    return this.toDomain(raw);
  }

  async findById(id: string): Promise<DailyPatientCount | null> {
    const raw = await this.prisma.dailyCount.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return this.toDomain(raw);
  }

  async findByDoctorAndDate(doctorId: string, date: string): Promise<DailyPatientCount | null> {
    const raw = await this.prisma.dailyCount.findFirst({
      where: {
        doctorId,
        date,
      },
    });

    if (!raw) return null;

    return this.toDomain(raw);
  }

  async findByDoctorDateAndSchedule(
    doctorId: string,
    date: string,
    scheduleId?: string | null
  ): Promise<DailyPatientCount | null> {
    const raw = await this.prisma.dailyCount.findUnique({
      where: {
        doctorId_date_slotKey: {
          doctorId,
          date,
          slotKey: scheduleId ?? '',
        },
      },
    });

    if (!raw) return null;

    return this.toDomain(raw);
  }

  async findByDate(date: string): Promise<DailyPatientCount[]> {
    const records = await this.prisma.dailyCount.findMany({
      where: { date },
    });

    return records.map((record) => this.toDomain(record));
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

    return records.map((record) => this.toDomain(record));
  }

  private toDomain(raw: {
    id: string;
    doctorId: string;
    scheduleId: string | null;
    scheduleSnapshotStart: string | null;
    scheduleSnapshotEnd: string | null;
    date: string;
    patientCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): DailyPatientCount {
    return DailyPatientCount.create({
      id: raw.id,
      doctorId: raw.doctorId,
      scheduleId: raw.scheduleId,
      scheduleStartTime: raw.scheduleSnapshotStart,
      scheduleEndTime: raw.scheduleSnapshotEnd,
      date: raw.date,
      patientCount: raw.patientCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
