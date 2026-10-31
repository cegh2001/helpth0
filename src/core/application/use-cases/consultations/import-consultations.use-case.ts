import { ConsultationRepository } from '@/core/domain/repositories/consultation.repository';
import { Consultation, ConsultationProps } from '@/core/domain/entities/consultation.entity';
import {
  ConsultationParserPort,
  ParseConsultationsResult,
} from '@/core/application/ports/consultation-parser.port';

export interface ImportConsultationsInput {
  csvContent?: string;
  buffer?: Buffer;
  consultations?: ConsultationProps[];
}

export interface ImportConsultationsOutput {
  totalInFile: number;
  inserted: number;
  skippedDuplicates: number;
  errors: { rowNumber: number; message: string }[];
  summary: ParseConsultationsResult['summary'];
}

export class ImportConsultationsUseCase {
  constructor(
    private readonly consultationRepository: ConsultationRepository,
    private readonly parser: ConsultationParserPort
  ) {}

  async execute(input: ImportConsultationsInput): Promise<ImportConsultationsOutput> {
    if (input.consultations && input.consultations.length > 0) {
      const entities = input.consultations.map((c) => Consultation.create(c));
      const saveResult = await this.consultationRepository.saveMany(entities);
      return {
        totalInFile: entities.length,
        inserted: saveResult.inserted,
        skippedDuplicates: saveResult.skipped,
        errors: [],
        summary: {
          totalParsed: entities.length,
          totalAmountUsd: entities.reduce((s, c) => s + c.amountUsd, 0),
          totalAmountBs: entities.reduce((s, c) => s + c.totalBs, 0),
          totalExoneratedUsd: entities.reduce((s, c) => s + c.exoneratedAmountUsd, 0),
          exoneratedPatientsCount: entities.filter((c) => c.exonerationPercent > 0).length,
          averageBcvRate: 0,
          minBcvRate: 0,
          maxBcvRate: 0,
          uniqueDoctors: Array.from(new Set(entities.map((c) => c.doctorName))),
          uniqueSpecialties: Array.from(new Set(entities.map((c) => c.specialty))),
          dateRange: null,
        },
      };
    }

    const parseResult = input.buffer
      ? await this.parser.parseFromBuffer(input.buffer)
      : this.parser.parseFromCsv(input.csvContent || '');

    if (parseResult.consultations.length === 0) {
      return {
        totalInFile: 0,
        inserted: 0,
        skippedDuplicates: 0,
        errors: parseResult.errors,
        summary: parseResult.summary,
      };
    }

    const saveResult = await this.consultationRepository.saveMany(parseResult.consultations);

    return {
      totalInFile: parseResult.consultations.length,
      inserted: saveResult.inserted,
      skippedDuplicates: saveResult.skipped,
      errors: parseResult.errors,
      summary: parseResult.summary,
    };
  }
}
