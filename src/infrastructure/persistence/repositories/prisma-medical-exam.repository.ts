import { PrismaClient } from '@/generated/prisma/client';
import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';
import {
  MedicalExamFilter,
  MedicalExamRepository,
} from '@/core/domain/repositories/medical-exam.repository';

export class PrismaMedicalExamRepository implements MedicalExamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByImportHash(importHash: string): Promise<MedicalExam | null> {
    const raw = await this.prisma.medicalExam.findUnique({
      where: { importHash },
    });

    return raw ? this.toDomain(raw) : null;
  }

  async findMany(filter?: MedicalExamFilter): Promise<MedicalExam[]> {
    const where: Record<string, unknown> = {};

    if (filter?.date) {
      where.date = filter.date;
    } else if (filter?.startDate && filter?.endDate) {
      where.date = {
        gte: filter.startDate,
        lte: filter.endDate,
      };
    }

    if (filter?.status) {
      where.status = { equals: filter.status, mode: 'insensitive' };
    }

    if (filter?.searchQuery) {
      const q = filter.searchQuery.trim();
      where.OR = [
        { patientName: { contains: q, mode: 'insensitive' } },
        { patientCedula: { contains: q, mode: 'insensitive' } },
        { examName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.medicalExam.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    return records.map((r) => this.toDomain(r));
  }

  async save(exam: MedicalExam): Promise<MedicalExam> {
    let patientId: string | undefined = undefined;

    if (exam.patientCedula) {
      const patient = await this.prisma.patient.upsert({
        where: { cedula: exam.patientCedula },
        create: {
          cedula: exam.patientCedula,
          fullName: exam.patientName,
          birthDate: exam.patientBirthDate,
          phone: exam.patientPhone,
          address: exam.patientAddress,
        },
        update: {
          fullName: exam.patientName,
          birthDate: exam.patientBirthDate ?? undefined,
          phone: exam.patientPhone ?? undefined,
          address: exam.patientAddress ?? undefined,
        },
      });
      patientId = patient.id;
    }

    const raw = await this.prisma.medicalExam.upsert({
      where: { importHash: exam.importHash },
      create: {
        id: exam.id,
        date: exam.date,
        patient: patientId ? { connect: { id: patientId } } : undefined,
        patientName: exam.patientName,
        patientCedula: exam.patientCedula,
        patientBirthDate: exam.patientBirthDate,
        patientPhone: exam.patientPhone,
        patientAddress: exam.patientAddress,
        examName: exam.examName,
        amountPointBs: exam.amountPointBs,
        amountMobileBs: exam.amountMobileBs,
        amountCashBs: exam.amountCashBs,
        bcvRate: exam.bcvRate,
        amountUsd: exam.amountUsd,
        totalBs: exam.totalBs,
        status: exam.status,
        exonerationPercent: exam.exonerationPercent,
        exoneratedAmountUsd: exam.exoneratedAmountUsd,
        observations: exam.observations,
        importHash: exam.importHash,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      },
      update: {
        patient: patientId ? { connect: { id: patientId } } : undefined,
        patientName: exam.patientName,
        patientCedula: exam.patientCedula,
        patientBirthDate: exam.patientBirthDate,
        patientPhone: exam.patientPhone,
        patientAddress: exam.patientAddress,
        examName: exam.examName,
        amountPointBs: exam.amountPointBs,
        amountMobileBs: exam.amountMobileBs,
        amountCashBs: exam.amountCashBs,
        bcvRate: exam.bcvRate,
        amountUsd: exam.amountUsd,
        totalBs: exam.totalBs,
        status: exam.status,
        exonerationPercent: exam.exonerationPercent,
        exoneratedAmountUsd: exam.exoneratedAmountUsd,
        observations: exam.observations,
        updatedAt: exam.updatedAt,
      },
    });

    return this.toDomain(raw);
  }

  async saveMany(exams: MedicalExam[]): Promise<{
    inserted: number;
    skipped: number;
    items: MedicalExam[];
  }> {
    if (exams.length === 0) {
      return { inserted: 0, skipped: 0, items: [] };
    }

    const hashes = exams.map((c) => c.importHash);
    const existing = await this.prisma.medicalExam.findMany({
      where: { importHash: { in: hashes } },
      select: { importHash: true },
    });

    const existingSet = new Set(existing.map((e) => e.importHash));

    const batchSeen = new Set<string>();
    const uniqueBatch: MedicalExam[] = [];
    let intraBatchDuplicates = 0;

    for (const item of exams) {
      if (batchSeen.has(item.importHash)) {
        intraBatchDuplicates++;
      } else {
        batchSeen.add(item.importHash);
        uniqueBatch.push(item);
      }
    }

    const newRowsCount = uniqueBatch.filter((c) => !existingSet.has(c.importHash)).length;

    for (const item of uniqueBatch) {
      await this.save(item);
    }

    const allSaved = await this.findMany({
      startDate: exams[0].date,
      endDate: exams[exams.length - 1].date,
    });

    return {
      inserted: newRowsCount,
      skipped: intraBatchDuplicates,
      items: allSaved,
    };
  }

  private toDomain(raw: {
    id: string;
    date: string;
    patientId: string | null;
    patientName: string;
    patientCedula: string | null;
    patientBirthDate: string | null;
    patientPhone: string | null;
    patientAddress: string | null;
    examName: string | null;
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
  }): MedicalExam {
    return MedicalExam.reconstruct({
      id: raw.id,
      date: raw.date,
      patientId: raw.patientId,
      patientName: raw.patientName,
      patientCedula: raw.patientCedula,
      patientBirthDate: raw.patientBirthDate,
      patientPhone: raw.patientPhone,
      patientAddress: raw.patientAddress,
      examName: raw.examName,
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
