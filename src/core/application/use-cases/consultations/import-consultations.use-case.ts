import { ConsultationRepository } from '@/core/domain/repositories/consultation.repository';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { SpecialtyRateRepository } from '@/core/domain/repositories/specialty-rate.repository';
import { Doctor } from '@/core/domain/entities/doctor.entity';
import {
  Consultation,
  ConsultationProps,
} from '@/core/domain/entities/consultation.entity';
import {
  DEFAULT_SPECIALTY_RATE_USD,
} from '@/core/domain/entities/specialty-rate.entity';
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
    private readonly doctorRepository?: DoctorRepository,
    private readonly specialtyRateRepository?: SpecialtyRateRepository
  ) {}

  private async loadRatesMap(): Promise<Map<string, number>> {
    const ratesMap = new Map<string, number>();
    if (!this.specialtyRateRepository) return ratesMap;
    const rates = await this.specialtyRateRepository.findAll();
    for (const r of rates) {
      ratesMap.set(r.specialty.trim().toLowerCase(), r.standardRateUsd);
    }
    return ratesMap;
  }

  private resolveConsultationAmounts(
    c: {
      amountPointBs?: number;
      amountMobileBs?: number;
      amountCashBs?: number;
      bcvRate?: number;
      amountUsd?: number;
      totalBs?: number;
      exonerationPercent?: number;
      exoneratedAmountUsd?: number;
      specialty?: string;
    },
    ratesMap: Map<string, number>
  ): { amountUsd: number; totalBs: number; exoneratedAmountUsd: number } {
    const amountPointBs = Number(c.amountPointBs) || 0;
    const amountMobileBs = Number(c.amountMobileBs) || 0;
    const amountCashBs = Number(c.amountCashBs) || 0;
    const bcvRate = Number(c.bcvRate) || 0;
    let amountUsd = Number(c.amountUsd) || 0;
    let totalBs = Number(c.totalBs) || 0;
    const percent = Math.max(0, Math.min(100, Number(c.exonerationPercent) || 0));
    let exonUsd = Number(c.exoneratedAmountUsd) || 0;

    const paidBs = amountPointBs + amountMobileBs + amountCashBs;
    if (paidBs > 0) {
      if (totalBs <= 0) totalBs = paidBs;
      if (amountUsd <= 0 && bcvRate > 0) {
        amountUsd = Number((paidBs / bcvRate).toFixed(2));
      }
    } else if (amountUsd > 0 && bcvRate > 0 && totalBs <= 0) {
      totalBs = Number((amountUsd * bcvRate).toFixed(2));
    }

    if (percent > 0) {
      if (amountUsd <= 0) {
        const normSpec = (c.specialty || '').trim().toLowerCase();
        const fallbackRate =
          ratesMap.get(normSpec) ??
          (normSpec === 'psicologia' ? 15 : DEFAULT_SPECIALTY_RATE_USD);
        amountUsd = fallbackRate;
      }
      if (exonUsd <= 0 && amountUsd > 0) {
        exonUsd = Number(((amountUsd * percent) / 100).toFixed(2));
      }
      if (totalBs <= 0 && amountUsd > 0 && bcvRate > 0) {
        totalBs = Number((amountUsd * bcvRate).toFixed(2));
      }
    }

    return { amountUsd, totalBs, exoneratedAmountUsd: exonUsd };
  }

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
    const ratesMap = await this.loadRatesMap();

    if (input.consultations && input.consultations.length > 0) {
      const doctorIdMap = await this.syncDoctors(input.consultations);

      const entities: Consultation[] = [];
      const errors: { rowNumber: number; message: string }[] = [];

      for (let i = 0; i < input.consultations.length; i++) {
        const c = input.consultations[i];
        try {
          const rawDate = String(c.date || '').slice(0, 10);
          const patientName = String(c.patientName || '').trim();
          const doctorName = String(c.doctorName || '').trim();
          const specialty = String(c.specialty || '').trim() || 'General';

          if (!patientName || !doctorName) {
            continue;
          }

          const { amountUsd, totalBs, exoneratedAmountUsd } =
            this.resolveConsultationAmounts(c, ratesMap);
          const percent = Math.max(0, Math.min(100, Number(c.exonerationPercent) || 0));

          const entity = Consultation.create({
            id: c.id,
            date: rawDate,
            patientId: c.patientId,
            patientName,
            patientCedula: c.patientCedula ? String(c.patientCedula).replace(/[^\d]/g, '') : null,
            patientPhone: c.patientPhone ? String(c.patientPhone).trim() : null,
            patientAddress: c.patientAddress ? String(c.patientAddress).trim() : null,
            doctorId: c.doctorId || (doctorName ? doctorIdMap.get(doctorName.toLowerCase()) : undefined),
            doctorName,
            specialty,
            amountPointBs: Number(c.amountPointBs) || 0,
            amountMobileBs: Number(c.amountMobileBs) || 0,
            amountCashBs: Number(c.amountCashBs) || 0,
            bcvRate: Number(c.bcvRate) || 0,
            amountUsd,
            totalBs,
            status: c.status
              ? String(c.status).trim()
              : percent === 100
                ? 'EXONERADO 100%'
                : percent > 0
                  ? `EXONERADO ${percent}%`
                  : 'COMPLETO',
            exonerationPercent: percent,
            exoneratedAmountUsd,
            observations: c.observations ? String(c.observations).trim() : null,
            importHash: c.importHash,
            createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
          });
          entities.push(entity);
        } catch (err) {
          errors.push({
            rowNumber: i + 1,
            message: err instanceof Error ? err.message : 'Error al procesar consulta',
          });
        }
      }

      if (entities.length === 0) {
        throw new Error('No se encontraron consultas válidas para importar');
      }

      const saveResult = await this.consultationRepository.saveMany(entities);
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
          uniqueDoctors: Array.from(new Set(entities.map((c) => c.doctorName))),
          uniqueSpecialties: Array.from(new Set(entities.map((c) => c.specialty))),
          dateRange: dates.length > 0 ? { min: dates[0], max: dates[dates.length - 1] } : null,
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
    const enrichedConsultations = parseResult.consultations.map((c) => {
      const { amountUsd, totalBs, exoneratedAmountUsd } =
        this.resolveConsultationAmounts(c, ratesMap);

      return Consultation.create({
        ...c,
        amountUsd,
        totalBs,
        exoneratedAmountUsd,
        doctorId: c.doctorId || (c.doctorName ? doctorIdMap.get(c.doctorName.toLowerCase()) : undefined),
      });
    });

    const saveResult = await this.consultationRepository.saveMany(enrichedConsultations);

    return {
      totalInFile: parseResult.consultations.length,
      inserted: saveResult.inserted,
      skippedDuplicates: saveResult.skipped,
      errors: parseResult.errors,
      summary: parseResult.summary,
    };
  }
}
