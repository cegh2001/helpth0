import { PrismaClient } from '@prisma/client';
import { Doctor } from '@/core/domain/entities/doctor.entity';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';

export class PrismaDoctorRepository implements DoctorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(doctor: Doctor): Promise<void> {
    await this.prisma.doctor.upsert({
      where: { id: doctor.id },
      create: {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        isActive: doctor.isActive,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
      },
      update: {
        name: doctor.name,
        specialty: doctor.specialty,
        isActive: doctor.isActive,
        updatedAt: doctor.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Doctor | null> {
    const raw = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!raw) return null;

    return Doctor.create({
      id: raw.id,
      name: raw.name,
      specialty: raw.specialty,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findAll(): Promise<Doctor[]> {
    const records = await this.prisma.doctor.findMany({
      orderBy: { name: 'asc' },
    });

    return records.map((r) =>
      Doctor.create({
        id: r.id,
        name: r.name,
        specialty: r.specialty,
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }

  async findActive(): Promise<Doctor[]> {
    const records = await this.prisma.doctor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return records.map((r) =>
      Doctor.create({
        id: r.id,
        name: r.name,
        specialty: r.specialty,
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    );
  }

}
