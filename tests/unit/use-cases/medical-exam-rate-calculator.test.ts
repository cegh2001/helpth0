import { describe, expect, it } from 'vitest';
import { resolveMedicalExamAmounts } from '@/core/application/use-cases/exams/medical-exam-rate.calculator';

describe('medical-exam-rate.calculator', () => {
  it('resolves 50% exoneration when Divisas has copay ($7.50) and TOTAL has full Bs ($15.00 at BCV)', () => {
    const resolved = resolveMedicalExamAmounts({
      amountPointBs: 6625.42,
      bcvRate: 883.39,
      amountUsd: 7.5,
      totalBs: 13250.85,
      observations: 'EXONERADO 50%',
    });

    expect(resolved.baseUsd).toBe(15);
    expect(resolved.amountUsd).toBe(7.5);
    expect(resolved.exoneratedAmountUsd).toBe(7.5);
    expect(resolved.exonerationPercent).toBe(50);
    expect(resolved.status).toBe('EXONERADO 50%');
    expect(resolved.totalBs).toBe(13250.85);
  });

  it('resolves 50% exoneration when Divisas has full base ($15.00) and Punto has 50% copay (6575.92 Bs)', () => {
    const resolved = resolveMedicalExamAmounts({
      amountPointBs: 6575.92,
      bcvRate: 876.79,
      amountUsd: 15,
      totalBs: 13151.85,
      observations: 'EXONERADO 50%',
    });

    expect(resolved.baseUsd).toBe(15);
    expect(resolved.amountUsd).toBe(7.5);
    expect(resolved.exoneratedAmountUsd).toBe(7.5);
    expect(resolved.exonerationPercent).toBe(50);
    expect(resolved.status).toBe('EXONERADO 50%');
    expect(resolved.totalBs).toBe(13151.85);
  });

  it('resolves 50% exoneration when Divisas has $3.00, deriving base as $6.00 and exonerated as $3.00', () => {
    const resolved = resolveMedicalExamAmounts({
      amountPointBs: 0,
      bcvRate: 888.89,
      amountUsd: 3,
      totalBs: 2600,
      observations: 'EXONERADO 50%',
    });

    expect(resolved.baseUsd).toBe(6);
    expect(resolved.amountUsd).toBe(3);
    expect(resolved.exoneratedAmountUsd).toBe(3);
    expect(resolved.exonerationPercent).toBe(50);
    expect(resolved.status).toBe('EXONERADO 50%');
  });

  it('resolves 50% exoneration when Divisas has $6.50, deriving base as $13.00 and exonerated as $6.50', () => {
    const resolved = resolveMedicalExamAmounts({
      amountPointBs: 5792.15,
      bcvRate: 891.1,
      amountUsd: 6.5,
      totalBs: 11584.3,
      observations: 'EXONERADO 50%',
    });

    expect(resolved.baseUsd).toBe(13);
    expect(resolved.amountUsd).toBe(6.5);
    expect(resolved.exoneratedAmountUsd).toBe(6.5);
    expect(resolved.exonerationPercent).toBe(50);
    expect(resolved.status).toBe('EXONERADO 50%');
  });

  it('resolves 100% exoneration with $0 copay and full base exonerated', () => {
    const resolved = resolveMedicalExamAmounts({
      amountPointBs: 0,
      bcvRate: 881.87,
      amountUsd: 13,
      totalBs: 11464.31,
      observations: 'EXONERADO 100%',
    });

    expect(resolved.baseUsd).toBe(13);
    expect(resolved.amountUsd).toBe(0);
    expect(resolved.exoneratedAmountUsd).toBe(13);
    expect(resolved.exonerationPercent).toBe(100);
    expect(resolved.status).toBe('EXONERADO 100%');
    expect(resolved.totalBs).toBe(11464.31);
  });

  it('handles regular non-exonerated exams without changes', () => {
    const resolved = resolveMedicalExamAmounts({
      amountPointBs: 12902.55,
      bcvRate: 860.17,
      amountUsd: 15,
      totalBs: 12902.55,
      observations: 'COMPLETO',
      status: 'COMPLETO',
    });

    expect(resolved.baseUsd).toBe(15);
    expect(resolved.amountUsd).toBe(15);
    expect(resolved.exoneratedAmountUsd).toBe(0);
    expect(resolved.exonerationPercent).toBe(0);
    expect(resolved.status).toBe('COMPLETO');
  });
});
