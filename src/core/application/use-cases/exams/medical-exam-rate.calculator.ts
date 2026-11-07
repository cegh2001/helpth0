export interface RawMedicalExamPaymentInput {
  amountPointBs?: number;
  amountMobileBs?: number;
  amountCashBs?: number;
  bcvRate?: number;
  amountUsd?: number;
  totalBs?: number;
  exonerationPercent?: number;
  exoneratedAmountUsd?: number;
  status?: string;
  observations?: string | null;
}

export interface ResolvedMedicalExamAmounts {
  amountUsd: number;
  totalBs: number;
  baseUsd: number;
  exoneratedAmountUsd: number;
  exonerationPercent: number;
  status: string;
}

/**
 * Resolves medical exam payment breakdown and exoneration calculation.
 *
 * Handles Excel variations where:
 * - Divisas carries the patient's copay (e.g. $7.50, $6.50, $3.00, $2.50)
 *   while TOTAL carries the 100% price in Bs ($15, $13, $6, $5 at BCV).
 * - Divisas carries the full base price (e.g. $15, $13) while Punto carries the 50% copay.
 * - Both Divisas and TOTAL carry the discounted 50% amount with 0 paid.
 * - 100% exonerated items where the patient pays $0 and the church covers the full fee.
 */
export function resolveMedicalExamAmounts(
  input: RawMedicalExamPaymentInput
): ResolvedMedicalExamAmounts {
  const amountPointBs = Number(input.amountPointBs) || 0;
  const amountMobileBs = Number(input.amountMobileBs) || 0;
  const amountCashBs = Number(input.amountCashBs) || 0;
  const bcvRate = Number(input.bcvRate) || 0;
  let rawUsd = Number(input.amountUsd) || 0;
  let totalBs = Number(input.totalBs) || 0;

  const paidBs = amountPointBs + amountMobileBs + amountCashBs;
  if (paidBs > 0) {
    if (totalBs <= 0) totalBs = paidBs;
    if (rawUsd <= 0 && bcvRate > 0) {
      rawUsd = Number((paidBs / bcvRate).toFixed(2));
    }
  } else if (rawUsd > 0 && bcvRate > 0 && totalBs <= 0) {
    totalBs = Number((rawUsd * bcvRate).toFixed(2));
  }

  const rawObs = `${input.observations ?? ''} ${input.status ?? ''}`.toUpperCase();
  const hasExoneratedKeyword = rawObs.includes('EXONERAD');
  const explicitPercent = Number(input.exonerationPercent) || 0;
  const explicitExonUsd = Number(input.exoneratedAmountUsd) || 0;

  if (!hasExoneratedKeyword && explicitPercent <= 0 && explicitExonUsd <= 0) {
    let status = input.status ? String(input.status).trim() : 'COMPLETO';
    if (rawObs.includes('PENDIENTE')) status = 'PENDIENTE DE PAGO';
    else if (rawObs.includes('REPETICION')) status = 'REPETICION';

    return {
      amountUsd: rawUsd,
      totalBs,
      baseUsd: rawUsd,
      exoneratedAmountUsd: 0,
      exonerationPercent: 0,
      status,
    };
  }

  // Parse exoneration percentage
  let percent = explicitPercent;
  if (percent <= 0) {
    const matchPct = rawObs.match(/(\d{1,3})\s*%/);
    if (matchPct) {
      percent = Math.min(100, Math.max(0, parseInt(matchPct[1], 10)));
    } else if (rawObs.includes('MITAD') || rawObs.includes('MEDIA')) {
      percent = 50;
    } else {
      const matchNum = rawObs.match(/EXONERAD[AO]S?\s*(?:AL)?\s*(\d{1,3})/);
      percent = matchNum ? Math.min(100, Math.max(0, parseInt(matchNum[1], 10))) : 100;
    }
  }

  const status = percent === 100 ? 'EXONERADO 100%' : `EXONERADO ${percent}%`;

  const impliedTotalBsUsd = bcvRate > 0 && totalBs > 0 ? Number((totalBs / bcvRate).toFixed(2)) : 0;
  const paidUsd = bcvRate > 0 && paidBs > 0 ? Number((paidBs / bcvRate).toFixed(2)) : 0;

  let baseUsd = 0;
  let exoneratedAmountUsd = explicitExonUsd;
  let copayUsd = 0;

  if (percent === 100) {
    baseUsd = rawUsd > 0 ? rawUsd : impliedTotalBsUsd;
    exoneratedAmountUsd = exoneratedAmountUsd > 0 ? exoneratedAmountUsd : baseUsd;
    copayUsd = 0;
    if (totalBs <= 0 && bcvRate > 0) {
      totalBs = Number((baseUsd * bcvRate).toFixed(2));
    }
  } else {
    // Partial exoneration (e.g. 50%)
    if (exoneratedAmountUsd > 0) {
      baseUsd = Number(((exoneratedAmountUsd * 100) / percent).toFixed(2));
      copayUsd = Number((baseUsd - exoneratedAmountUsd).toFixed(2));
    } else if (impliedTotalBsUsd > 0 && impliedTotalBsUsd >= rawUsd * 1.4) {
      // e.g. Rodriga Gomez: totalBs = 13.250,85 (~$15), rawUsd = $7.50. Full base is $15, copay is $7.50.
      baseUsd = Math.round(impliedTotalBsUsd * 10) / 10;
      exoneratedAmountUsd = Number(((baseUsd * percent) / 100).toFixed(2));
      copayUsd = Number((baseUsd - exoneratedAmountUsd).toFixed(2));
    } else if (paidUsd > 0 && rawUsd >= paidUsd * 1.4) {
      // e.g. Olga Moreno: rawUsd = $15, paidUsd = $7.50. Full base is $15, copay is $7.50.
      baseUsd = Math.round(rawUsd * 10) / 10;
      exoneratedAmountUsd = Number(((baseUsd * percent) / 100).toFixed(2));
      copayUsd = Number((baseUsd - exoneratedAmountUsd).toFixed(2));
    } else if (rawUsd > 0) {
      // e.g. Mailet Contreras ($3.00), Dinora Carballo ($6.50), Luis Regalado ($2.50)
      baseUsd = Number(((rawUsd * 100) / (100 - percent)).toFixed(2));
      exoneratedAmountUsd = Number(((baseUsd * percent) / 100).toFixed(2));
      copayUsd = rawUsd;
    } else if (impliedTotalBsUsd > 0) {
      baseUsd = Number(((impliedTotalBsUsd * 100) / (100 - percent)).toFixed(2));
      exoneratedAmountUsd = Number(((baseUsd * percent) / 100).toFixed(2));
      copayUsd = Number((baseUsd - exoneratedAmountUsd).toFixed(2));
    }

    if (totalBs <= 0 && bcvRate > 0) {
      totalBs = Number((baseUsd * bcvRate).toFixed(2));
    }
  }

  return {
    amountUsd: copayUsd,
    totalBs,
    baseUsd,
    exoneratedAmountUsd,
    exonerationPercent: percent,
    status,
  };
}
