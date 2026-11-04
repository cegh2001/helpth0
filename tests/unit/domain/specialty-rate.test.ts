import { describe, expect, it } from 'vitest';
import {
  SpecialtyRate,
  normalizeSpecialtyName,
} from '@/core/domain/entities/specialty-rate.entity';

describe('SpecialtyRate Entity', () => {
  it('creates a valid specialty rate entity', () => {
    const rate = SpecialtyRate.create({
      specialty: 'Psicologia',
      standardRateUsd: 15,
    });

    expect(rate.specialty).toBe('Psicologia');
    expect(rate.standardRateUsd).toBe(15);
    expect(rate.id.length).toBeGreaterThan(0);
  });

  it('throws an error if specialty is empty or whitespace', () => {
    expect(() =>
      SpecialtyRate.create({
        specialty: '   ',
        standardRateUsd: 15,
      })
    ).toThrow('Specialty name cannot be empty');
  });

  it('throws an error if standardRateUsd is negative', () => {
    expect(() =>
      SpecialtyRate.create({
        specialty: 'Traumatologia',
        standardRateUsd: -5,
      })
    ).toThrow('Standard rate in USD must be a non-negative number');
  });

  it('normalizes specialty names consistently', () => {
    expect(normalizeSpecialtyName('  Medicina   Interna  ')).toBe('medicina interna');
  });
});
