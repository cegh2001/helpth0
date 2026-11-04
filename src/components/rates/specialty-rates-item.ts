import { SpecialtyRate } from '@/core/domain/entities/specialty-rate.entity';

export interface SpecialtyRateItem {
  id: string;
  specialty: string;
  standardRateUsd: number;
}

export function toSpecialtyRateItem(rate: SpecialtyRate): SpecialtyRateItem {
  return {
    id: rate.id,
    specialty: rate.specialty,
    standardRateUsd: rate.standardRateUsd,
  };
}

export function toSpecialtyRateItems(rates: SpecialtyRate[]): SpecialtyRateItem[] {
  return rates.map(toSpecialtyRateItem);
}
