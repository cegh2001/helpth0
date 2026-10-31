import { generateEntityId, IdGenerator } from '@/core/domain/id-generator';
import {
  assertValidCalendarDate,
  getCalendarDayName,
} from '@/core/domain/validation/calendar-date';

export interface TherapySessionProps {
  id?: string;
  date: string; // YYYY-MM-DD
  therapistName: string;
  specialty: string;
  sessionIndex: number; // 1..N inside the therapist/day block
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

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Therapies carry no patient identity: a row IS a session. Rows sharing date,
 * therapist and specialty are numerically indistinguishable, so the positional
 * session index is the only stable discriminator. Amounts and observations are
 * deliberately excluded: editing one of them must not fabricate a new session.
 */
export function computeTherapyImportHash(
  date: string,
  therapistName: string,
  specialty: string,
  sessionIndex: number
): string {
  const normDate = date.trim();
  const normTherapist = normalizeLabel(therapistName);
  const normSpecialty = normalizeLabel(specialty);
  const normIndex = Math.trunc(Math.max(1, Number(sessionIndex) || 1));
  return `${normDate}_${normTherapist}_${normSpecialty}_${normIndex}`;
}

/**
 * `status` is a closed vocabulary in therapies. The shared exoneration
 * calculator copies free-text observations into `status` for the sibling
 * modules; here that would pollute the status index with prose that already
 * lives in `observations`, so the percentage is the single source of truth.
 */
export function resolveTherapyStatus(rawStatus: string | null | undefined, exonerationPercent: number): string {
  if (exonerationPercent >= 100) return 'EXONERADO 100%';
  if (exonerationPercent > 0) return `EXONERADO ${exonerationPercent}%`;

  const normalized = (rawStatus ?? '').trim().toUpperCase();
  if (normalized.includes('PENDIENTE')) return 'PENDIENTE DE PAGO';
  if (normalized.includes('REPETICION')) return 'REPETICION';
  return 'COMPLETO';
}

function resolveTotalBs(
  paidBs: number,
  amountUsd: number,
  bcvRate: number,
  explicitTotalBs?: number
): number {
  if (explicitTotalBs != null && explicitTotalBs > 0) return explicitTotalBs;
  if (paidBs > 0) return paidBs;
  if (amountUsd > 0 && bcvRate > 0) return Number((amountUsd * bcvRate).toFixed(2));
  return 0;
}

export class TherapySession {
  readonly id: string;
  readonly date: string;
  readonly therapistName: string;
  readonly specialty: string;
  readonly dayOfWeekName: string;
  readonly sessionIndex: number;
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

  private constructor(props: TherapySessionProps, generateId: IdGenerator) {
    assertValidCalendarDate(props.date);

    const therapist = props.therapistName.trim();
    if (!therapist) {
      throw new Error('Therapist name cannot be empty');
    }

    const specialty = props.specialty.trim();
    if (!specialty) {
      throw new Error('Therapy specialty cannot be empty');
    }

    const sessionIndex = Math.trunc(Number(props.sessionIndex));
    if (!Number.isInteger(sessionIndex) || sessionIndex < 1) {
      throw new Error('Session index must be a positive integer');
    }

    this.id = props.id ?? generateId();
    this.date = props.date;
    this.therapistName = therapist;
    this.specialty = specialty;
    this.dayOfWeekName = getCalendarDayName(props.date);
    this.sessionIndex = sessionIndex;

    this.amountPointBs = Math.max(0, props.amountPointBs ?? 0);
    this.amountMobileBs = Math.max(0, props.amountMobileBs ?? 0);
    this.amountCashBs = Math.max(0, props.amountCashBs ?? 0);
    this.bcvRate = Math.max(0, props.bcvRate ?? 0);
    this.amountUsd = Math.max(0, props.amountUsd ?? 0);

    const paidBs = this.amountPointBs + this.amountMobileBs + this.amountCashBs;
    this.totalBs = resolveTotalBs(paidBs, this.amountUsd, this.bcvRate, props.totalBs);

    this.exonerationPercent = Math.max(0, Math.min(100, props.exonerationPercent ?? 0));
    this.status = resolveTherapyStatus(props.status, this.exonerationPercent);
    this.exoneratedAmountUsd = Math.max(0, props.exoneratedAmountUsd ?? 0);
    this.observations = props.observations?.trim() || null;

    this.importHash =
      props.importHash ||
      computeTherapyImportHash(this.date, this.therapistName, this.specialty, this.sessionIndex);

    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(
    props: TherapySessionProps,
    generateId: IdGenerator = generateEntityId
  ): TherapySession {
    return new TherapySession(props, generateId);
  }

  static reconstruct(props: TherapySessionProps): TherapySession {
    return new TherapySession(props, () => props.id ?? generateEntityId());
  }
}

export type TherapySessionEntity = TherapySession;
