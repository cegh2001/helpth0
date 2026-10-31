import { Consultation } from '@/core/domain/entities/consultation.entity';
import { ParseConsultationsSummary } from '@/core/application/ports/consultation-parser.port';

export function parseNumeric(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  const clean = str.replace(/[^\d.,-]/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');
    if (lastComma > lastDot) {
      const normalized = clean.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(normalized);
      return isNaN(num) ? 0 : num;
    } else {
      const normalized = clean.replace(/,/g, '');
      const num = parseFloat(normalized);
      return isNaN(num) ? 0 : num;
    }
  }

  if (clean.includes(',')) {
    const normalized = clean.replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function computeExoneration(
  observations: string | null,
  amountUsd: number,
  bcvRate: number,
  paidBs: number
): { status: string; exonerationPercent: number; exoneratedAmountUsd: number } {
  if (!observations) {
    return { status: 'COMPLETO', exonerationPercent: 0, exoneratedAmountUsd: 0 };
  }

  const upper = observations.toUpperCase();
  if (!upper.includes('EXONERAD')) {
    if (upper.includes('PENDIENTE')) {
      return { status: 'PENDIENTE DE PAGO', exonerationPercent: 0, exoneratedAmountUsd: 0 };
    }
    if (upper.includes('REPETICION')) {
      return { status: 'REPETICION', exonerationPercent: 0, exoneratedAmountUsd: 0 };
    }
    return { status: observations, exonerationPercent: 0, exoneratedAmountUsd: 0 };
  }

  const match = upper.match(/(\d{1,3})\s*%/);
  let percent = 0;
  if (match) {
    percent = Math.min(100, Math.max(0, parseInt(match[1], 10)));
  } else if (upper.includes('MITAD') || upper.includes('MEDIA')) {
    percent = 50;
  } else {
    const matchNumber = upper.match(/EXONERAD[AO]S?\s*(?:AL)?\s*(\d{1,3})/);
    if (matchNumber) {
      percent = Math.min(100, Math.max(0, parseInt(matchNumber[1], 10)));
    } else {
      const expectedBs = amountUsd * bcvRate;
      if (paidBs <= 0 || expectedBs <= 0) {
        percent = 100;
      } else {
        const paidRatio = paidBs / expectedBs;
        if (paidRatio < 0.95) {
          percent = Math.round((1 - paidRatio) * 100);
        } else {
          percent = 100;
        }
      }
    }
  }

  const status = percent === 100 ? 'EXONERADO 100%' : `EXONERADO ${percent}%`;
  const exoneratedAmountUsd = Number(((amountUsd * percent) / 100).toFixed(2));

  return { status, exonerationPercent: percent, exoneratedAmountUsd };
}

export function buildConsultationsSummary(
  consultations: Consultation[],
  dates: string[]
): ParseConsultationsSummary {
  dates.sort();
  const doctors = Array.from(new Set(consultations.map((c) => c.doctorName)));
  const specialties = Array.from(new Set(consultations.map((c) => c.specialty)));
  const totalAmountUsd = consultations.reduce((sum, c) => sum + c.amountUsd, 0);
  const totalAmountBs = consultations.reduce((sum, c) => sum + c.totalBs, 0);
  const totalExoneratedUsd = Number(
    consultations.reduce((sum, c) => sum + c.exoneratedAmountUsd, 0).toFixed(2)
  );
  const exoneratedPatientsCount = consultations.filter((c) => c.exonerationPercent > 0).length;

  const bcvRates = consultations.map((c) => c.bcvRate).filter((r) => r > 0);
  const minBcvRate = bcvRates.length > 0 ? Math.min(...bcvRates) : 0;
  const maxBcvRate = bcvRates.length > 0 ? Math.max(...bcvRates) : 0;
  const averageBcvRate =
    bcvRates.length > 0
      ? Number((bcvRates.reduce((s, r) => s + r, 0) / bcvRates.length).toFixed(2))
      : 0;

  return {
    totalParsed: consultations.length,
    totalAmountUsd,
    totalAmountBs,
    totalExoneratedUsd,
    exoneratedPatientsCount,
    averageBcvRate,
    minBcvRate,
    maxBcvRate,
    uniqueDoctors: doctors,
    uniqueSpecialties: specialties,
    dateRange: dates.length > 0 ? { min: dates[0], max: dates[dates.length - 1] } : null,
  };
}
