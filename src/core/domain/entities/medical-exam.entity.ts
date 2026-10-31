import { generateEntityId, IdGenerator } from '@/core/domain/id-generator';
import { assertValidCalendarDate } from '@/core/domain/validation/calendar-date';

export interface MedicalExamProps {
  id?: string;
  date: string; // YYYY-MM-DD
  patientId?: string | null;
  patientName: string;
  patientCedula?: string | null;
  patientBirthDate?: string | null;
  patientPhone?: string | null;
  patientAddress?: string | null;
  examName?: string | null;
  amountPointBs?: number;
  amountMobileBs?: number;
  amountCashBs?: number;
  bcvRate?: number;
  amountUsd?: number;
  totalBs?: number;
  status?: string;
  exonerationPercent?: number;
  exoneratedAmountUsd?: number;
  observations?: string | null;
  importHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function computeMedicalExamImportHash(
  date: string,
  cedulaOrName: string,
  phone: string | null,
  amountUsd: number,
  observations: string | null
): string {
  const normDate = date.trim();
  const normSubject = cedulaOrName.trim().toLowerCase().replace(/\s+/g, ' ');
  const normPhone = (phone || '').trim().replace(/[^\d]/g, '');
  const normUsd = (amountUsd || 0).toFixed(2);
  const normObs = (observations || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${normDate}_${normSubject}_${normPhone}_${normUsd}_${normObs}`;
}

export class MedicalExam {
  readonly id: string;
  readonly date: string;
  readonly patientId: string | null;
  readonly patientName: string;
  readonly patientCedula: string | null;
  readonly patientBirthDate: string | null;
  readonly patientPhone: string | null;
  readonly patientAddress: string | null;
  readonly examName: string | null;
  readonly amountPointBs: number;
  readonly amountMobileBs: number;
  readonly amountCashBs: number;
  readonly bcvRate: number;
  readonly amountUsd: number;
  readonly totalBs: number;
  readonly status: string;
  readonly exonerationPercent: number;
  readonly exoneratedAmountUsd: number;
  readonly observations: string | null;
  readonly importHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: MedicalExamProps, generateId: IdGenerator) {
    assertValidCalendarDate(props.date);

    const name = props.patientName.trim();
    if (!name) {
      throw new Error('Patient name cannot be empty');
    }

    this.id = props.id ?? generateId();
    this.date = props.date;
    this.patientId = props.patientId ?? null;
    this.patientName = name;
    this.patientCedula = props.patientCedula?.trim() || null;
    this.patientBirthDate = props.patientBirthDate?.trim() || null;
    this.patientPhone = props.patientPhone?.trim() || null;
    this.patientAddress = props.patientAddress?.trim() || null;
    this.examName = props.examName?.trim() || null;

    this.amountPointBs = Math.max(0, props.amountPointBs ?? 0);
    this.amountMobileBs = Math.max(0, props.amountMobileBs ?? 0);
    this.amountCashBs = Math.max(0, props.amountCashBs ?? 0);
    this.bcvRate = Math.max(0, props.bcvRate ?? 0);
    this.amountUsd = Math.max(0, props.amountUsd ?? 0);

    const computedTotalBs = this.amountPointBs + this.amountMobileBs + this.amountCashBs;
    this.totalBs = props.totalBs != null && props.totalBs > 0 ? props.totalBs : computedTotalBs;

    this.status = props.status?.trim() || 'COMPLETO';
    this.exonerationPercent = Math.max(0, Math.min(100, props.exonerationPercent ?? 0));
    this.exoneratedAmountUsd = Math.max(0, props.exoneratedAmountUsd ?? 0);
    this.observations = props.observations?.trim() || null;

    const subjectIdentifier = this.patientCedula || this.patientName;
    this.importHash =
      props.importHash ||
      computeMedicalExamImportHash(
        this.date,
        subjectIdentifier,
        this.patientPhone,
        this.amountUsd,
        this.observations
      );

    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: MedicalExamProps, generateId: IdGenerator = generateEntityId): MedicalExam {
    return new MedicalExam(props, generateId);
  }

  static reconstruct(props: MedicalExamProps): MedicalExam {
    return new MedicalExam(props, () => props.id ?? generateEntityId());
  }
}

export type MedicalExamEntity = MedicalExam;
