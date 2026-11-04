import { describe, expect, it } from 'vitest';
import { resolveConsultationAmounts } from '@/core/application/use-cases/consultations/consultation-rate.calculator';

describe('consultation-rate.calculator', () => {
  it('automatically sets 100% exoneration and $15 for Psychology by default', () => {
    const ratesMap = new Map<string, number>();

    const resolved = resolveConsultationAmounts(
      {
        specialty: 'Psicologia',
        bcvRate: 860.17,
        amountPointBs: 12902.55,
        observations: 'EXONERADO',
      },
      ratesMap
    );

    expect(resolved.amountUsd).toBe(15);
    expect(resolved.exoneratedAmountUsd).toBe(15);
    expect(resolved.exonerationPercent).toBe(100);
    expect(resolved.status).toBe('EXONERADO 100%');
    expect(resolved.totalBs).toBe(12902.55);
  });

  it('automatically sets $10 fixed church contribution for regular specialties when patient pays $5 in caja', () => {
    const ratesMap = new Map<string, number>();

    const resolved = resolveConsultationAmounts(
      {
        specialty: 'Traumatologia',
        bcvRate: 860.17,
        amountPointBs: 4300.85, // 5 USD at BCV
        amountUsd: 5,
        observations: 'COMPLETO',
        status: 'COMPLETO',
      },
      ratesMap
    );

    expect(resolved.amountUsd).toBe(5);
    expect(resolved.totalBs).toBe(4300.85);
    expect(resolved.exoneratedAmountUsd).toBe(10);
    expect(resolved.exonerationPercent).toBe(67); // 10 / (5 + 10) = 66.67% -> 67%
    expect(resolved.status).toBe('COMPLETO');
  });

  it('uses configured rate from ratesMap when specialty is customized in /tarifas', () => {
    const ratesMap = new Map<string, number>([
      ['psicologia', 20],
      ['cardiologia', 12],
    ]);

    const psyResolved = resolveConsultationAmounts(
      {
        specialty: 'Psicologia',
        bcvRate: 800,
        amountPointBs: 0,
      },
      ratesMap
    );
    expect(psyResolved.amountUsd).toBe(20);
    expect(psyResolved.exoneratedAmountUsd).toBe(20);
    expect(psyResolved.totalBs).toBe(16000);

    const cardioResolved = resolveConsultationAmounts(
      {
        specialty: 'Cardiologia',
        bcvRate: 800,
        amountPointBs: 4000, // $5
      },
      ratesMap
    );
    expect(cardioResolved.amountUsd).toBe(5);
    expect(cardioResolved.exoneratedAmountUsd).toBe(12);
  });
});
