import { PrismaClient } from '@/generated/prisma/client';
import { Consultation } from '@/core/domain/entities/consultation.entity';
import {
  ConsultationFilter,
  ConsultationRepository,
} from '@/core/domain/repositories/consultation.repository';

export class PrismaConsultationRepository implements ConsultationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByImportHash(importHash: string): Promise<Consultation | null> {
    const raw = await this.prisma.consultation.findUnique({
      where: { importHash },
    });

    return raw ? this.toDomain(raw) : null;
  }

  async findMany(filter?: ConsultationFilter): Promise<Consultation[]> {
    const where: Record<string, unknown> = {};

    if (filter?.date) {
      where.date = filter.date;
    } else if (filter?.startDate && filter?.endDate) {
      where.date = {
        gte: filter.startDate,
        lte: filter.endDate,
      };
    }

    if (filter?.specialty) {
      where.specialty = { equals: filter.specialty, mode: 'insensitive' };
    }

    if (filter?.doctorName) {
      where.doctorName = { equals: filter.doctorName, mode: 'insensitive' };
    }

    if (filter?.status) {
      where.status = { equals: filter.status, mode: 'insensitive' };
    }

    const records = await this.prisma.consultation.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    return records.map((r) => this.toDomain(r));
  }

  async save(consultation: Consultation): Promise<Consultation> {
    let patientId: string | undefined = undefined;

    if (consultation.patientCedula) {
      const patient = await this.prisma.patient.upsert({
        where: { cedula: consultation.patientCedula },
        create: {
          cedula: consultation.patientCedula,
          fullName: consultation.patientName,
          phone: consultation.patientPhone,
          address: consultation.patientAddress,
        },
        update: {
          fullName: consultation.patientName,
          phone: consultation.patientPhone ?? undefined,
          address: consultation.patientAddress ?? undefined,
        },
      });
      patientId = patient.id;
    }

    const raw = await this.prisma.consultation.upsert({
      where: { importHash: consultation.importHash },
      create: {
        id: consultation.id,
        date: consultation.date,
        patientId,
        patientName: consultation.patientName,
        patientCedula: consultation.patientCedula,
        patientPhone: consultation.patientPhone,
        patientAddress: consultation.patientAddress,
        doctorName: consultation.doctorName,
        specialty: consultation.specialty,
        amountPointBs: consultation.amountPointBs,
        amountMobileBs: consultation.amountMobileBs,
        amountCashBs: consultation.amountCashBs,
        bcvRate: consultation.bcvRate,
        amountUsd: consultation.amountUsd,
        totalBs: consultation.totalBs,
        status: consultation.status,
        exonerationPercent: consultation.exonerationPercent,
        exoneratedAmountUsd: consultation.exoneratedAmountUsd,
        observations: consultation.observations,
        importHash: consultation.importHash,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
      },
      update: {
        patientPhone: consultation.patientPhone,
        patientAddress: consultation.patientAddress,
        amountPointBs: consultation.amountPointBs,
        amountMobileBs: consultation.amountMobileBs,
        amountCashBs: consultation.amountCashBs,
        bcvRate: consultation.bcvRate,
        amountUsd: consultation.amountUsd,
        totalBs: consultation.totalBs,
        status: consultation.status,
        exonerationPercent: consultation.exonerationPercent,
        exoneratedAmountUsd: consultation.exoneratedAmountUsd,
        observations: consultation.observations,
        updatedAt: consultation.updatedAt,
      },
    });

    return this.toDomain(raw);
  }

  async saveMany(consultations: Consultation[]): Promise<{
    inserted: number;
    skipped: number;
    items: Consultation[];
  }> {
    if (consultations.length === 0) {
      return { inserted: 0, skipped: 0, items: [] };
    }

    const hashes = consultations.map((c) => c.importHash);
    const existing = await this.prisma.consultation.findMany({
      where: { importHash: { in: hashes } },
      select: { importHash: true },
    });

    const existingSet = new Set(existing.map((e) => e.importHash));
    const toInsert = consultations.filter((c) => !existingSet.has(c.importHash));
    const skipped = consultations.length - toInsert.length;

    // Deduplicate within the current batch in case the file itself has duplicate lines
    const batchSeen = new Set<string>();
    const uniqueToInsert: Consultation[] = [];
    let intraBatchDuplicates = 0;

    for (const item of toInsert) {
      if (batchSeen.has(item.importHash)) {
        intraBatchDuplicates++;
      } else {
        batchSeen.add(item.importHash);
        uniqueToInsert.push(item);
      }
    }

    for (const item of uniqueToInsert) {
      await this.save(item);
    }

    const allSaved = await this.findMany({
      startDate: consultations[0].date,
      endDate: consultations[consultations.length - 1].date,
    });

    return {
      inserted: uniqueToInsert.length,
      skipped: skipped + intraBatchDuplicates,
      items: allSaved,
    };
  }

  private toDomain(raw: {
    id: string;
    date: string;
    patientId: string | null;
    patientName: string;
    patientCedula: string | null;
    patientPhone: string | null;
    patientAddress: string | null;
    doctorName: string;
    specialty: string;
    amountPointBs: number;
    amountMobileBs: number;
    amountCashBs: number;
    bcvRate: number;
    amountUsd: number;
    totalBs: number;
    status: string;
    exonerationPercent?: number;
    exoneratedAmountUsd?: number;
    observations: string | null;
    importHash: string;
    createdAt: Date;
    updatedAt: Date;
  }): Consultation {
    return Consultation.reconstruct({
      id: raw.id,
      date: raw.date,
      patientId: raw.patientId,
      patientName: raw.patientName,
      patientCedula: raw.patientCedula,
      patientPhone: raw.patientPhone,
      patientAddress: raw.patientAddress,
      doctorName: raw.doctorName,
      specialty: raw.specialty,
      amountPointBs: raw.amountPointBs,
      amountMobileBs: raw.amountMobileBs,
      amountCashBs: raw.amountCashBs,
      bcvRate: raw.bcvRate,
      amountUsd: raw.amountUsd,
      totalBs: raw.totalBs,
      status: raw.status,
      exonerationPercent: raw.exonerationPercent ?? 0,
      exoneratedAmountUsd: raw.exoneratedAmountUsd ?? 0,
      observations: raw.observations,
      importHash: raw.importHash,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
