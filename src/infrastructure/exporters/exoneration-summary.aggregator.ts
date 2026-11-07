export interface ExonerationRowItem {
  date: string;
  amountPointBs: number;
  amountMobileBs: number;
  amountCashBs: number;
  amountUsd: number;
  totalBs: number;
  status: string;
  observations?: string | null;
  bcvRate?: number;
  exonerationPercent?: number;
  exoneratedAmountUsd?: number;
  specialty?: string;
  patientName?: string;
}

export interface ParsedItemExoneration {
  isExonerated: boolean;
  percent: number;
  tierLabel: string;
  baseUsd: number;
  exoneratedUsd: number;
  exoneratedBs: number;
}

export interface ExonerationTierData {
  tierLabel: string;
  count: number;
  unitRateUsd: number;
  baseUsd: number;
  exoneratedUsd: number;
  exoneratedBs: number;
}

export interface ExonerationAggregationResult {
  tiers: ExonerationTierData[];
  totalExonCount: number;
  totalExonBaseUsd: number;
  totalExonUsd: number;
  totalExonBs: number;
  avgBcvRate: number;
}

export function parseExonerationTier(
  item: ExonerationRowItem,
  avgBcvRate = 0
): ParsedItemExoneration {
  let percent = 0;
  if (item.exonerationPercent != null && item.exonerationPercent > 0) {
    percent = Math.min(100, Math.max(0, item.exonerationPercent));
  } else {
    const rawText = `${item.observations ?? ''} ${item.status ?? ''}`.toUpperCase();
    if (rawText.includes('EXONERAD')) {
      const matchPct = rawText.match(/(\d{1,3})\s*%/);
      if (matchPct) {
        percent = Math.min(100, Math.max(0, parseInt(matchPct[1], 10)));
      } else if (rawText.includes('MITAD') || rawText.includes('MEDIA')) {
        percent = 50;
      } else {
        const matchNum = rawText.match(/EXONERAD[AO]S?\s*(?:AL)?\s*(\d{1,3})/);
        percent = matchNum ? Math.min(100, Math.max(0, parseInt(matchNum[1], 10))) : 100;
      }
    }
  }

  const hasExonAmount = item.exoneratedAmountUsd != null && item.exoneratedAmountUsd > 0;
  if (percent <= 0 && !hasExonAmount) {
    return {
      isExonerated: false,
      percent: 0,
      tierLabel: 'Sin Exoneración',
      baseUsd: item.amountUsd,
      exoneratedUsd: 0,
      exoneratedBs: 0,
    };
  }

  let exoneratedUsd = 0;
  let baseUsd = item.amountUsd;

  if (item.exoneratedAmountUsd != null && item.exoneratedAmountUsd > 0) {
    exoneratedUsd = item.exoneratedAmountUsd;
    if (percent === 100) {
      baseUsd = Math.max(baseUsd, exoneratedUsd);
    } else if (percent > 0) {
      const calculatedBase = Number(((exoneratedUsd * 100) / percent).toFixed(2));
      if (item.amountUsd > 0 && item.amountUsd < calculatedBase) {
        baseUsd = Number((item.amountUsd + exoneratedUsd).toFixed(2));
      } else {
        baseUsd = Math.max(baseUsd, calculatedBase);
      }
    }
  } else if (baseUsd > 0) {
    exoneratedUsd = Number(((baseUsd * percent) / 100).toFixed(2));
  } else if (item.totalBs > 0 && item.bcvRate && item.bcvRate > 0) {
    baseUsd = Number((item.totalBs / item.bcvRate).toFixed(2));
    exoneratedUsd = Number(((baseUsd * percent) / 100).toFixed(2));
  }

  const rate = item.bcvRate && item.bcvRate > 0 ? item.bcvRate : avgBcvRate;
  const exoneratedBs = rate > 0 ? Number((exoneratedUsd * rate).toFixed(2)) : 0;
  const tierLabel = percent === 100
    ? 'Exonerado 100%'
    : percent === 67
      ? 'Aporte Fijo Congregación ($10)'
      : `Exonerado ${percent}%`;

  return {
    isExonerated: true,
    percent,
    tierLabel,
    baseUsd,
    exoneratedUsd,
    exoneratedBs,
  };
}

export function aggregateExonerations(items: ExonerationRowItem[]): ExonerationAggregationResult {
  const validRates = items
    .map((i) => i.bcvRate)
    .filter((r): r is number => typeof r === 'number' && r > 0);
  const avgBcvRate = validRates.length > 0
    ? validRates.reduce((acc, r) => acc + r, 0) / validRates.length
    : 0;

  const tierMap = new Map<string, ExonerationTierData>();
  let totalExonCount = 0;
  let totalExonBaseUsd = 0;
  let totalExonUsd = 0;
  let totalExonBs = 0;

  for (const item of items) {
    const parsed = parseExonerationTier(item, avgBcvRate);
    if (!parsed.isExonerated) continue;

    const unitRate = parsed.tierLabel.includes('100%')
      ? 15
      : (parsed.tierLabel.includes('$10') || parsed.percent === 67 ? 10 : (parsed.baseUsd > 0 ? parsed.baseUsd : 10));

    const cur = tierMap.get(parsed.tierLabel) ?? {
      tierLabel: parsed.tierLabel,
      count: 0,
      unitRateUsd: unitRate,
      baseUsd: 0,
      exoneratedUsd: 0,
      exoneratedBs: 0,
    };
    cur.count++;
    cur.baseUsd = Number((cur.baseUsd + parsed.baseUsd).toFixed(2));
    cur.exoneratedUsd = Number((cur.exoneratedUsd + parsed.exoneratedUsd).toFixed(2));
    cur.exoneratedBs = Number((cur.exoneratedBs + parsed.exoneratedBs).toFixed(2));
    if (parsed.tierLabel.includes('$10') || parsed.percent === 67) {
      cur.unitRateUsd = 10;
    } else {
      cur.unitRateUsd = Number((cur.baseUsd / cur.count).toFixed(2));
    }
    tierMap.set(parsed.tierLabel, cur);

    totalExonCount++;
    totalExonBaseUsd = Number((totalExonBaseUsd + parsed.baseUsd).toFixed(2));
    totalExonUsd = Number((totalExonUsd + parsed.exoneratedUsd).toFixed(2));
    totalExonBs = Number((totalExonBs + parsed.exoneratedBs).toFixed(2));
  }

  const sortedTiers = Array.from(tierMap.values()).sort((a, b) => {
    const pA = parseInt(a.tierLabel.replace(/\D/g, ''), 10) || 0;
    const pB = parseInt(b.tierLabel.replace(/\D/g, ''), 10) || 0;
    return pB - pA;
  });

  return {
    tiers: sortedTiers,
    totalExonCount,
    totalExonBaseUsd,
    totalExonUsd,
    totalExonBs,
    avgBcvRate,
  };
}
