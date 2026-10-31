import { ConsultationRepository } from '@/core/domain/repositories/consultation.repository';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { Doctor } from '@/core/domain/entities/doctor.entity';
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
    private readonly parser: ConsultationParserPort,
    private readonly doctorRepository?: DoctorRepository
  ) {}

  private async syncDoctors(
    consultations: Array<{ doctorName: string; specialty: string }>
  ): Promise<Map<string, string>> {
    const doctorIdMap = new Map<string, string>();
    if (!this.doctorRepository) return doctorIdMap;

    const uniqueMap = new Map<string, string>();
    for (const c of consultations) {
      const name = c.doctorName?.trim();
      if (!name) continue;
      const spec = c.specialty?.trim() || 'General';
      if (!uniqueMap.has(name) || (spec !== 'General' && uniqueMap.get(name) === 'General')) {
        uniqueMap.set(name, spec);
      }
    }

    for (const [name, specialty] of uniqueMap.entries()) {
      let doc = await this.doctorRepository.findByName(name);
      if (!doc) {
        doc = Doctor.create({
          name,
          specialty,
          isActive: true,
        });
        await this.doctorRepository.save(doc);
      } else if (specialty && specialty !== 'General' && doc.specialty === 'General') {
        doc.updateDetails(doc.name, specialty);
        await this.doctorRepository.save(doc);
      }
      doctorIdMap.set(name.toLowerCase(), doc.id);
    }

    return doctorIdMap;
  }

  async execute(input: ImportConsultationsInput): Promise<ImportConsultationsOutput> {
    if (input.consultations && input.consultations.length > 0) {
      const doctorIdMap = await this.syncDoctors(input.consultations);

      const entities = input.consultations.map((c) =>
        Consultation.create({
          ...c,
          doctorId: c.doctorId || doctorIdMap.get(c.doctorName.toLowerCase()),
        })
      );
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

    const doctorIdMap = await this.syncDoctors(parseResult.consultations);
    const enrichedConsultations = parseResult.consultations.map((c) =>
      Consultation.create({
        ...c,
        doctorId: c.doctorId || doctorIdMap.get(c.doctorName.toLowerCase()),
      })
    );

    const saveResult = await this.consultationRepository.saveMany(enrichedConsultations);

    return {
      totalInFile: enrichedConsultations.length,
      inserted: saveResult.inserted,
      skippedDuplicates: saveResult.skipped,
      errors: parseResult.errors,
      summary: parseResult.summary,
    };
  }
}
