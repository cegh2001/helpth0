import { describe, expect, it } from 'vitest';
import { SpecialtyRate } from '@/core/domain/entities/specialty-rate.entity';
import {
  toSpecialtyRateItem,
  toSpecialtyRateItems,
} from '@/components/rates/specialty-rates-item';

describe('SpecialtyRateItem mapping', () => {
  it('maps a SpecialtyRate entity to plain view model item', () => {
    const entity = SpecialtyRate.create({
      id: 'rate-1',
      specialty: 'Psicologia',
      standardRateUsd: 15,
    });

    const item = toSpecialtyRateItem(entity);

    expect(item.id).toBe('rate-1');
    expect(item.specialty).toBe('Psicologia');
    expect(item.standardRateUsd).toBe(15);
  });

  it('maps an array of SpecialtyRate entities to plain view model items', () => {
    const entities = [
      SpecialtyRate.create({ id: 'rate-1', specialty: 'Psicologia', standardRateUsd: 15 }),
      SpecialtyRate.create({ id: 'rate-2', specialty: 'Cardiologia', standardRateUsd: 20 }),
    ];

    const items = toSpecialtyRateItems(entities);

    expect(items.length).toBe(2);
    expect(items[0].specialty).toBe('Psicologia');
    expect(items[1].specialty).toBe('Cardiologia');
  });
});
