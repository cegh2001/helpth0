import { PrismaClient } from '@/generated/prisma/client';
import { SpecialtyRate } from '@/core/domain/entities/specialty-rate.entity';
import { SpecialtyRateRepository } from '@/core/domain/repositories/specialty-rate.repository';

export class PrismaSpecialtyRateRepository implements SpecialtyRateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<SpecialtyRate[]> {
    const records = await this.prisma.specialtyRate.findMany({
      orderBy: { specialty: 'asc' },
    });

    return records.map((r) =>
      SpecialtyRate.reconstruct({
        id: r.id,
        specialty: r.specialty,
        standardRateUsd: r.standardRateUsd,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }

  async findBySpecialty(specialty: string): Promise<SpecialtyRate | null> {
    const record = await this.prisma.specialtyRate.findFirst({
      where: {
        specialty: {
          equals: specialty.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (!record) return null;

    return SpecialtyRate.reconstruct({
      id: record.id,
      specialty: record.specialty,
      standardRateUsd: record.standardRateUsd,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async upsert(rate: SpecialtyRate): Promise<SpecialtyRate> {
    const existing = await this.findBySpecialty(rate.specialty);
    const targetId = existing ? existing.id : rate.id;

    const saved = await this.prisma.specialtyRate.upsert({
      where: { id: targetId },
      create: {
        id: targetId,
        specialty: rate.specialty.trim(),
        standardRateUsd: rate.standardRateUsd,
        createdAt: rate.createdAt,
        updatedAt: rate.updatedAt,
      },
      update: {
        specialty: rate.specialty.trim(),
        standardRateUsd: rate.standardRateUsd,
        updatedAt: new Date(),
      },
    });

    return SpecialtyRate.reconstruct({
      id: saved.id,
      specialty: saved.specialty,
      standardRateUsd: saved.standardRateUsd,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.specialtyRate.deleteMany({
      where: { id },
    });
  }
}
