import { MedicalExam, MedicalExamProps } from '@/core/domain/entities/medical-exam.entity';
import { MedicalExamRepository } from '@/core/domain/repositories/medical-exam.repository';
import {
  MedicalExamParserPort,
  ParseMedicalExamsResult,
} from '@/core/application/ports/medical-exam-parser.port';
import { resolveMedicalExamAmounts } from './medical-exam-rate.calculator';

export interface ImportMedicalExamsInput {
  csvContent?: string;
  buffer?: Buffer;
  exams?: MedicalExamProps[];
}

export interface ImportMedicalExamsOutput {
  totalInFile: number;
  inserted: number;
  skippedDuplicates: number;
  errors: { rowNumber: number; message: string }[];
  summary: ParseMedicalExamsResult['summary'];
}

export class ImportMedicalExamsUseCase {
  constructor(
    private readonly examRepository: MedicalExamRepository,
    private readonly parser: MedicalExamParserPort
  ) {}

  async execute(input: ImportMedicalExamsInput): Promise<ImportMedicalExamsOutput> {
    if (input.exams && input.exams.length > 0) {
      const entities: MedicalExam[] = [];
      const errors: { rowNumber: number; message: string }[] = [];

      for (let i = 0; i < input.exams.length; i++) {
        const item = input.exams[i];
        try {
          const rawDate = String(item.date || '').slice(0, 10);
          const patientName = String(item.patientName || '').trim();

          if (!patientName) {
            continue;
          }

          const amountPointBs = Number(item.amountPointBs) || 0;
          const amountMobileBs = Number(item.amountMobileBs) || 0;
          const amountCashBs = Number(item.amountCashBs) || 0;
          const bcvRate = Number(item.bcvRate) || 0;
          const amountUsd = Number(item.amountUsd) || 0;
          const totalBs = Number(item.totalBs) || 0;

          const resolved = resolveMedicalExamAmounts({
            amountPointBs,
            amountMobileBs,
            amountCashBs,
            bcvRate,
            amountUsd,
            totalBs,
            exonerationPercent: item.exonerationPercent,
            exoneratedAmountUsd: item.exoneratedAmountUsd,
            status: item.status,
            observations: item.observations,
          });

          const entity = MedicalExam.create({
            id: item.id,
            date: rawDate,
            patientId: item.patientId,
            patientName,
            patientCedula: item.patientCedula ? String(item.patientCedula).replace(/[^\d]/g, '') : null,
            patientBirthDate: item.patientBirthDate ? String(item.patientBirthDate).trim() : null,
            patientPhone: item.patientPhone ? String(item.patientPhone).trim() : null,
            patientAddress: item.patientAddress ? String(item.patientAddress).trim() : null,
            examName: item.examName ? String(item.examName).trim() : null,
            amountPointBs,
            amountMobileBs,
            amountCashBs,
            bcvRate,
            amountUsd: resolved.amountUsd,
            totalBs: resolved.totalBs,
            status: resolved.status,
            exonerationPercent: resolved.exonerationPercent,
            exoneratedAmountUsd: resolved.exoneratedAmountUsd,
            observations: item.observations ? String(item.observations).trim() : null,
            importHash: item.importHash,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          });

          entities.push(entity);
        } catch (err) {
          errors.push({
            rowNumber: i + 1,
            message: err instanceof Error ? err.message : 'Error al procesar examen',
          });
        }
      }

      if (entities.length === 0) {
        throw new Error('No se encontraron exámenes válidos para importar');
      }

      const saveResult = await this.examRepository.saveMany(entities);
      const bcvRates = entities.map((c) => c.bcvRate).filter((r) => r > 0);
      const dates = entities.map((c) => c.date).sort();

      return {
        totalInFile: entities.length,
        inserted: saveResult.inserted,
        skippedDuplicates: saveResult.skipped,
        errors,
        summary: {
          totalParsed: entities.length,
          totalAmountUsd: entities.reduce((s, c) => s + c.amountUsd, 0),
          totalAmountBs: entities.reduce((s, c) => s + c.totalBs, 0),
          totalExoneratedUsd: entities.reduce((s, c) => s + c.exoneratedAmountUsd, 0),
          exoneratedPatientsCount: entities.filter((c) => c.exonerationPercent > 0).length,
          averageBcvRate:
            bcvRates.length > 0 ? Number((bcvRates.reduce((a, b) => a + b, 0) / bcvRates.length).toFixed(2)) : 0,
          minBcvRate: bcvRates.length > 0 ? Math.min(...bcvRates) : 0,
          maxBcvRate: bcvRates.length > 0 ? Math.max(...bcvRates) : 0,
          dateRange: dates.length > 0 ? { min: dates[0], max: dates[dates.length - 1] } : null,
        },
      };
    }

    const parseResult = input.buffer
      ? await this.parser.parseFromBuffer(input.buffer)
      : this.parser.parseFromCsv(input.csvContent || '');

    if (parseResult.exams.length === 0) {
      return {
        totalInFile: 0,
        inserted: 0,
        skippedDuplicates: 0,
        errors: parseResult.errors,
        summary: parseResult.summary,
      };
    }

    const saveResult = await this.examRepository.saveMany(parseResult.exams);

    return {
      totalInFile: parseResult.exams.length,
      inserted: saveResult.inserted,
      skippedDuplicates: saveResult.skipped,
      errors: parseResult.errors,
      summary: parseResult.summary,
    };
  }
}
