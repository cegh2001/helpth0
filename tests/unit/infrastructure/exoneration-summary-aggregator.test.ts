import { describe, expect, it } from 'vitest';
import {
  aggregateExonerations,
  parseExonerationTier,
  ExonerationRowItem,
} from '@/infrastructure/exporters/exoneration-summary.aggregator';

describe('exoneration-summary.aggregator', () => {
  it('returns isExonerated false for regular non-exonerated items', () => {
    const item: ExonerationRowItem = {
      date: '2026-10-01',
      amountPointBs: 4300,
      amountMobileBs: 0,
      amountCashBs: 0,
      amountUsd: 5,
      totalBs: 4300,
      status: 'COMPLETO',
      observations: null,
      bcvRate: 860,
    };

    const parsed = parseExonerationTier(item, 860);

    expect(parsed.isExonerated).toBe(false);
    expect(parsed.percent).toBe(0);
    expect(parsed.exoneratedUsd).toBe(0);
    expect(parsed.exoneratedBs).toBe(0);
  });

  it('correctly calculates 100% exonerated items with explicit fields', () => {
    const item: ExonerationRowItem = {
      date: '2026-10-01',
      amountPointBs: 0,
      amountMobileBs: 0,
      amountCashBs: 0,
      amountUsd: 15,
      totalBs: 0,
      status: 'EXONERADO 100%',
      exonerationPercent: 100,
      exoneratedAmountUsd: 15,
      bcvRate: 860,
    };

    const parsed = parseExonerationTier(item, 860);

    expect(parsed.isExonerated).toBe(true);
    expect(parsed.percent).toBe(100);
    expect(parsed.tierLabel).toBe('Exonerado 100%');
    expect(parsed.baseUsd).toBe(15);
    expect(parsed.exoneratedUsd).toBe(15);
    expect(parsed.exoneratedBs).toBe(12900);
  });

  it('correctly calculates 50% partial exoneration and falls back to avgBcvRate when row rate is zero', () => {
    const item: ExonerationRowItem = {
      date: '2026-10-02',
      amountPointBs: 8600,
      amountMobileBs: 0,
      amountCashBs: 0,
      amountUsd: 20,
      totalBs: 8600,
      status: 'EXONERADO 50%',
      observations: 'EXONERADO 50% HERMANA CARMEN',
      exonerationPercent: 50,
      bcvRate: 0,
    };

    const parsed = parseExonerationTier(item, 860);

    expect(parsed.isExonerated).toBe(true);
    expect(parsed.percent).toBe(50);
    expect(parsed.tierLabel).toBe('Exonerado 50%');
    expect(parsed.baseUsd).toBe(20);
    expect(parsed.exoneratedUsd).toBe(10);
    expect(parsed.exoneratedBs).toBe(8600);
  });

  it('detects exonerations from observations when exonerationPercent is not explicitly provided', () => {
    const item: ExonerationRowItem = {
      date: '2026-10-03',
      amountPointBs: 0,
      amountMobileBs: 0,
      amountCashBs: 0,
      amountUsd: 30,
      totalBs: 0,
      status: 'COMPLETO',
      observations: 'EXONERADO AL 100%',
      bcvRate: 800,
    };

    const parsed = parseExonerationTier(item, 800);

    expect(parsed.isExonerated).toBe(true);
    expect(parsed.percent).toBe(100);
    expect(parsed.exoneratedUsd).toBe(30);
    expect(parsed.exoneratedBs).toBe(24000);
  });

  it('aggregates multiple tiers and sorts them descending by percentage', () => {
    const items: ExonerationRowItem[] = [
      {
        date: '2026-10-01',
        amountPointBs: 0,
        amountMobileBs: 0,
        amountCashBs: 0,
        amountUsd: 10,
        totalBs: 0,
        status: 'EXONERADO 100%',
        exonerationPercent: 100,
        exoneratedAmountUsd: 10,
        bcvRate: 850,
      },
      {
        date: '2026-10-02',
        amountPointBs: 8500,
        amountMobileBs: 0,
        amountCashBs: 0,
        amountUsd: 20,
        totalBs: 8500,
        status: 'EXONERADO 50%',
        exonerationPercent: 50,
        exoneratedAmountUsd: 10,
        bcvRate: 850,
      },
      {
        date: '2026-10-03',
        amountPointBs: 17000,
        amountMobileBs: 0,
        amountCashBs: 0,
        amountUsd: 20,
        totalBs: 17000,
        status: 'COMPLETO',
        bcvRate: 850,
      },
    ];

    const result = aggregateExonerations(items);

    expect(result.totalExonCount).toBe(2);
    expect(result.totalExonBaseUsd).toBe(30);
    expect(result.totalExonUsd).toBe(20);
    expect(result.totalExonBs).toBe(17000);
    expect(result.tiers.length).toBe(2);
    expect(result.tiers[0].tierLabel).toBe('Exonerado 100%');
    expect(result.tiers[0].count).toBe(1);
    expect(result.tiers[0].exoneratedUsd).toBe(10);
    expect(result.tiers[1].tierLabel).toBe('Exonerado 50%');
    expect(result.tiers[1].count).toBe(1);
    expect(result.tiers[1].exoneratedUsd).toBe(10);
  });
});
