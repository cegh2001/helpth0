import { SpecialtyRate } from '@/core/domain/entities/specialty-rate.entity';
import { SpecialtyRateRepositoryPort } from '@/core/application/ports/specialty-rate-repository.port';

export interface SaveSpecialtyRateInput {
  id?: string;
  specialty: string;
  standardRateUsd: number;
}

export class SaveSpecialtyRateUseCase {
  constructor(private readonly rateRepository: SpecialtyRateRepositoryPort) {}

  async execute(input: SaveSpecialtyRateInput): Promise<SpecialtyRate> {
    const entity = SpecialtyRate.create({
      id: input.id,
      specialty: input.specialty,
      standardRateUsd: input.standardRateUsd,
    });

    return this.rateRepository.upsert(entity);
  }
}
