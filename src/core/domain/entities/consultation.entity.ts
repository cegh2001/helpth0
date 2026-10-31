import { generateEntityId, IdGenerator } from '@/core/domain/id-generator';
import { assertValidCalendarDate } from '@/core/domain/validation/calendar-date';

export interface ConsultationProps {
  id?: string;
  date: string; // YYYY-MM-DD
  patientId?: string | null;
  patientName: string;
  patientCedula?: string | null;
  patientPhone?: string | null;
  patientAddress?: string | null;
  doctorName: string;
  specialty: string;
  amountPointBs?: number;
  amountMobileBs?: number;
  amountCashBs?: number;
  bcvRate?: number;
  amountUsd?: number;
  totalBs?: number;
  status?: string;
  observations?: string | null;
  importHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function computeConsultationImportHash(
  date: string,
  cedulaOrName: string,
  doctorName: string,
  specialty: string
): string {
  const normDate = date.trim();
  const normSubject = cedulaOrName.trim().toLowerCase().replace(/\s+/g, ' ');
  const normDoctor = doctorName.trim().toLowerCase().replace(/\s+/g, ' ');
  const normSpecialty = specialty.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${normDate}_${normSubject}_${normDoctor}_${normSpecialty}`;
}

export class Consultation {
  readonly id: string;
  readonly date: string;
  readonly patientId: string | null;
  readonly patientName: string;
  readonly patientCedula: string | null;
  readonly patientPhone: string | null;
  readonly patientAddress: string | null;
  readonly doctorName: string;
  readonly specialty: string;
  readonly amountPointBs: number;
  readonly amountMobileBs: number;
  readonly amountCashBs: number;
  readonly bcvRate: number;
  readonly amountUsd: number;
  readonly totalBs: number;
  readonly status: string;
  readonly observations: string | null;
  readonly importHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: ConsultationProps, generateId: IdGenerator) {
    assertValidCalendarDate(props.date);

    const name = props.patientName.trim();
    if (!name) {
      throw new Error('Patient name cannot be empty');
    }

    const doctor = props.doctorName.trim();
    if (!doctor) {
      throw new Error('Doctor name cannot be empty');
    }

    const spec = props.specialty.trim();
    if (!spec) {
      throw new Error('Specialty cannot be empty');
    }

    this.id = props.id ?? generateId();
    this.date = props.date;
    this.patientId = props.patientId ?? null;
    this.patientName = name;
    this.patientCedula = props.patientCedula?.trim() || null;
    this.patientPhone = props.patientPhone?.trim() || null;
    this.patientAddress = props.patientAddress?.trim() || null;
    this.doctorName = doctor;
    this.specialty = spec;

    this.amountPointBs = Math.max(0, props.amountPointBs ?? 0);
    this.amountMobileBs = Math.max(0, props.amountMobileBs ?? 0);
    this.amountCashBs = Math.max(0, props.amountCashBs ?? 0);
    this.bcvRate = Math.max(0, props.bcvRate ?? 0);
    this.amountUsd = Math.max(0, props.amountUsd ?? 0);

    const computedTotalBs = this.amountPointBs + this.amountMobileBs + this.amountCashBs;
    this.totalBs = props.totalBs != null && props.totalBs > 0 ? props.totalBs : computedTotalBs;

    this.status = props.status?.trim() || 'COMPLETO';
    this.observations = props.observations?.trim() || null;

    const subjectIdentifier = this.patientCedula || this.patientName;
    this.importHash = props.importHash || computeConsultationImportHash(
      this.date,
      subjectIdentifier,
      this.doctorName,
      this.specialty
    );

    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: ConsultationProps, generateId: IdGenerator = generateEntityId): Consultation {
    return new Consultation(props, generateId);
  }

  static reconstruct(props: ConsultationProps): Consultation {
    return new Consultation(props, () => props.id ?? generateEntityId());
  }
}

export type ConsultationEntity = Consultation;
