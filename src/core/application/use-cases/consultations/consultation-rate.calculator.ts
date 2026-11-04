import { DEFAULT_SPECIALTY_RATE_USD } from '@/core/domain/entities/specialty-rate.entity';

export interface RawConsultationPaymentInput {
  amountPointBs?: number;
  amountMobileBs?: number;
  amountCashBs?: number;
  bcvRate?: number;
  amountUsd?: number;
  totalBs?: number;
  exonerationPercent?: number;
  exoneratedAmountUsd?: number;
  specialty?: string;
  status?: string;
  observations?: string | null;
}

export interface ResolvedConsultationAmounts {
  amountUsd: number;
  totalBs: number;
  exoneratedAmountUsd: number;
  exonerationPercent: number;
  status: string;
}

/**
 * Resolves consultation payment breakdown based on specialty rates.
 * - Psicología: 100% exonerated by default ($15 standard rate or configured in /tarifas).
 * - Other specialties: fixed church contribution ($10 standard or configured in /tarifas),
 *   while the patient covers their copay in caja (typically $5 at official BCV rate).
 */
export function resolveConsultationAmounts(
  c: RawConsultationPaymentInput,
  ratesMap: Map<string, number>
): ResolvedConsultationAmounts {
  const amountPointBs = Number(c.amountPointBs) || 0;
  const amountMobileBs = Number(c.amountMobileBs) || 0;
  const amountCashBs = Number(c.amountCashBs) || 0;
  const bcvRate = Number(c.bcvRate) || 0;
  let amountUsd = Number(c.amountUsd) || 0;
  let totalBs = Number(c.totalBs) || 0;

  const paidBs = amountPointBs + amountMobileBs + amountCashBs;
  if (paidBs > 0) {
    if (totalBs <= 0) totalBs = paidBs;
    if (amountUsd <= 0 && bcvRate > 0) {
      amountUsd = Number((paidBs / bcvRate).toFixed(2));
    }
  } else if (amountUsd > 0 && bcvRate > 0 && totalBs <= 0) {
    totalBs = Number((amountUsd * bcvRate).toFixed(2));
  }

  const normSpec = (c.specialty || '').trim().toLowerCase();
  const isPsychology = normSpec === 'psicologia';
  const configuredRate =
    ratesMap.get(normSpec) ??
    (isPsychology ? 15 : DEFAULT_SPECIALTY_RATE_USD);

  let exoneratedAmountUsd = Number(c.exoneratedAmountUsd) || 0;
  let exonerationPercent = Number(c.exonerationPercent) || 0;
  let status = c.status ? String(c.status).trim() : 'COMPLETO';

  if (isPsychology) {
    // Psicología: 100% exonerada con la tarifa fijada ($15 por defecto o monto explícito)
    if (amountUsd <= 0) {
      amountUsd = configuredRate;
    }
    exoneratedAmountUsd = exoneratedAmountUsd > 0
      ? exoneratedAmountUsd
      : (amountUsd >= configuredRate ? amountUsd : configuredRate);
    exonerationPercent = 100;
    status = 'EXONERADO 100%';
    if (totalBs <= 0 && bcvRate > 0) {
      totalBs = Number((amountUsd * bcvRate).toFixed(2));
    }
  } else if (c.exonerationPercent === 100 || (exonerationPercent === 100 && paidBs <= 0)) {
    // Exoneración explícita al 100% en otra especialidad
    if (amountUsd <= 0) amountUsd = configuredRate;
    exoneratedAmountUsd = exoneratedAmountUsd > 0
      ? exoneratedAmountUsd
      : (amountUsd >= configuredRate ? amountUsd : configuredRate);
    exonerationPercent = 100;
    status = 'EXONERADO 100%';
    if (totalBs <= 0 && bcvRate > 0) {
      totalBs = Number((amountUsd * bcvRate).toFixed(2));
    }
  } else {
    // Paciente regular: aporte fijo automático de la congregación ($10 por defecto)
    exoneratedAmountUsd = exoneratedAmountUsd > 0 ? exoneratedAmountUsd : configuredRate;
    if (amountUsd <= 0) {
      amountUsd = paidBs > 0 && bcvRate > 0 ? Number((paidBs / bcvRate).toFixed(2)) : 5;
    }
    const totalServiceUsd = amountUsd + exoneratedAmountUsd;
    exonerationPercent = totalServiceUsd > 0
      ? Math.round((exoneratedAmountUsd / totalServiceUsd) * 100)
      : 67;
    if (!c.status || c.status === 'COMPLETO') {
      status = 'COMPLETO';
    }
  }

  return {
    amountUsd,
    totalBs,
    exoneratedAmountUsd,
    exonerationPercent,
    status,
  };
}
