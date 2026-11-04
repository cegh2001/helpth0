import { generateEntityId, IdGenerator } from '@/core/domain/id-generator';

export const DEFAULT_SPECIALTY_RATE_USD = 10;

export interface SpecialtyRateProps {
  id?: string;
  specialty: string;
  standardRateUsd: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export function normalizeSpecialtyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export class SpecialtyRate {
  readonly id: string;
  readonly specialty: string;
  readonly standardRateUsd: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: SpecialtyRateProps, generateId: IdGenerator) {
    const trimmed = props.specialty.trim();
    if (!trimmed) {
      throw new Error('Specialty name cannot be empty');
    }

    if (props.standardRateUsd == null || isNaN(props.standardRateUsd) || props.standardRateUsd < 0) {
      throw new Error('Standard rate in USD must be a non-negative number');
    }

    this.id = props.id ?? generateId();
    this.specialty = trimmed;
    this.standardRateUsd = Number(props.standardRateUsd.toFixed(2));
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(
    props: SpecialtyRateProps,
    generateId: IdGenerator = generateEntityId
  ): SpecialtyRate {
    return new SpecialtyRate(props, generateId);
  }

  static reconstruct(props: SpecialtyRateProps): SpecialtyRate {
    return new SpecialtyRate(props, () => props.id ?? generateEntityId());
  }
}

export type SpecialtyRateEntity = SpecialtyRate;
