import { ConsultationRepository } from '@/core/domain/repositories/consultation.repository';
import {
  ConsultationParserPort,
  ParseConsultationsResult,
} from '@/core/application/ports/consultation-parser.port';

export interface ImportConsultationsInput {
  csvContent?: string;
  buffer?: Buffer;
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
