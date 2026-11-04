import {
  DEFAULT_SPECIALTY_RATE_USD,
  SpecialtyRate,
} from '@/core/domain/entities/specialty-rate.entity';
import { SpecialtyRateRepositoryPort } from '@/core/application/ports/specialty-rate-repository.port';

export interface GetSpecialtyRatesResult {
  defaultRateUsd: number;
  rates: SpecialtyRate[];
}

export class GetSpecialtyRatesUseCase {
  constructor(private readonly rateRepository: SpecialtyRateRepositoryPort) {}

  async execute(): Promise<GetSpecialtyRatesResult> {
    const rates = await this.rateRepository.findAll();

    return {
      defaultRateUsd: DEFAULT_SPECIALTY_RATE_USD,
      rates,
    };
  }
}
