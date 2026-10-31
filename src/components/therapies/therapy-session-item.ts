import type { TherapySession } from '@/core/domain/entities/therapy-session.entity';

export interface TherapySessionItem {
  id: string;
  date: string;
  therapistName: string;
  specialty: string;
  dayOfWeekName: string;
  sessionIndex: number;
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
}

/**
 * Domain entities cannot cross the server/client boundary, and the client only
 * needs the columns it renders. This is the delivery view model: no importHash,
 * no timestamps.
 */
export function toTherapySessionItems(sessions: TherapySession[]): TherapySessionItem[] {
  return sessions.map((session) => ({
    id: session.id,
    date: session.date,
    therapistName: session.therapistName,
    specialty: session.specialty,
    dayOfWeekName: session.dayOfWeekName,
    sessionIndex: session.sessionIndex,
    amountPointBs: session.amountPointBs,
    amountMobileBs: session.amountMobileBs,
    amountCashBs: session.amountCashBs,
    bcvRate: session.bcvRate,
    amountUsd: session.amountUsd,
    totalBs: session.totalBs,
    status: session.status,
    exonerationPercent: session.exonerationPercent,
    exoneratedAmountUsd: session.exoneratedAmountUsd,
    observations: session.observations,
  }));
}
