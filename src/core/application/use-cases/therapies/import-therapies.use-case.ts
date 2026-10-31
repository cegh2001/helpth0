import {
  TherapySession,
  TherapySessionProps,
} from '@/core/domain/entities/therapy-session.entity';
import { TherapyRepository } from '@/core/domain/repositories/therapy.repository';
import {
  ParseTherapiesResult,
  TherapyParserPort,
} from '@/core/application/ports/therapy-parser.port';

export interface ImportTherapiesInput {
  csvContent?: string;
  buffer?: Buffer;
  therapies?: TherapySessionProps[];
}

export interface ImportTherapiesOutput {
  totalInFile: number;
  inserted: number;
  skippedDuplicates: number;
  errors: { rowNumber: number; message: string }[];
  summary: ParseTherapiesResult['summary'];
}

export class ImportTherapiesUseCase {
  constructor(
    private readonly therapyRepository: TherapyRepository,
    private readonly parser: TherapyParserPort
  ) {}

  async execute(input: ImportTherapiesInput): Promise<ImportTherapiesOutput> {
    if (input.therapies && input.therapies.length > 0) {
      return this.persistReviewedRows(input.therapies);
    }

    const parseResult = input.buffer
      ? await this.parser.parseFromBuffer(input.buffer)
      : this.parser.parseFromCsv(input.csvContent || '');

    if (parseResult.sessions.length === 0) {
      return {
        totalInFile: 0,
        inserted: 0,
        skippedDuplicates: 0,
        errors: parseResult.errors,
        summary: parseResult.summary,
      };
    }

    const saveResult = await this.therapyRepository.saveMany(parseResult.sessions);

    return {
      totalInFile: parseResult.sessions.length,
      inserted: saveResult.inserted,
      skippedDuplicates: saveResult.skipped,
      errors: parseResult.errors,
      summary: parseResult.summary,
    };
  }

  private async persistReviewedRows(
    rows: TherapySessionProps[]
  ): Promise<ImportTherapiesOutput> {
    const entities: TherapySession[] = [];
    const errors: { rowNumber: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      try {
        const therapistName = String(item.therapistName || '').trim();
        const specialty = String(item.specialty || '').trim();

        if (!therapistName) {
          throw new Error('Therapist name cannot be empty');
        }
        if (!specialty) {
          throw new Error('Therapy specialty cannot be empty');
        }

        const amountPointBs = Number(item.amountPointBs) || 0;
        const amountMobileBs = Number(item.amountMobileBs) || 0;
        const amountCashBs = Number(item.amountCashBs) || 0;
        const bcvRate = Number(item.bcvRate) || 0;
        let amountUsd = Number(item.amountUsd) || 0;
        const totalBs = Number(item.totalBs) || 0;

        const paidBs = amountPointBs + amountMobileBs + amountCashBs;
        if (paidBs > 0 && amountUsd <= 0 && bcvRate > 0) {
          amountUsd = Number((paidBs / bcvRate).toFixed(2));
        }

        const percent = Math.max(0, Math.min(100, Number(item.exonerationPercent) || 0));
        let exonUsd = Number(item.exoneratedAmountUsd) || 0;
        if (percent > 0 && exonUsd === 0 && amountUsd > 0) {
          exonUsd = Number(((amountUsd * percent) / 100).toFixed(2));
        }

        const entity = TherapySession.create({
          id: item.id,
          date: String(item.date || '').slice(0, 10),
          therapistName,
          specialty,
          sessionIndex: Number(item.sessionIndex) || 0,
          amountPointBs,
          amountMobileBs,
          amountCashBs,
          bcvRate,
          amountUsd,
          totalBs,
          status: item.status ? String(item.status).trim() : undefined,
          exonerationPercent: percent,
          exoneratedAmountUsd: exonUsd,
          observations: item.observations ? String(item.observations).trim() : null,
          importHash: item.importHash,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        });

        entities.push(entity);
      } catch (err) {
        errors.push({
          rowNumber: i + 1,
          message: err instanceof Error ? err.message : 'Error al procesar la sesión',
        });
      }
    }

    if (entities.length === 0) {
      throw new Error('No se encontraron terapias válidas para importar');
    }

    const saveResult = await this.therapyRepository.saveMany(entities);
    const dates = entities.map((c) => c.date).sort();
    const bcvRates = entities.map((c) => c.bcvRate).filter((r) => r > 0);

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
        exoneratedSessionsCount: entities.filter((c) => c.exonerationPercent > 0).length,
        averageBcvRate:
          bcvRates.length > 0
            ? Number((bcvRates.reduce((a, b) => a + b, 0) / bcvRates.length).toFixed(2))
            : 0,
        minBcvRate: bcvRates.length > 0 ? Math.min(...bcvRates) : 0,
        maxBcvRate: bcvRates.length > 0 ? Math.max(...bcvRates) : 0,
        uniqueTherapists: Array.from(new Set(entities.map((c) => c.therapistName))),
        uniqueSpecialties: Array.from(new Set(entities.map((c) => c.specialty))),
        dateRange:
          dates.length > 0 ? { min: dates[0], max: dates[dates.length - 1] } : null,
      },
    };
  }
}
