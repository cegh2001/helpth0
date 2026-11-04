import { SpecialtyRateRepositoryPort } from '@/core/application/ports/specialty-rate-repository.port';

export class DeleteSpecialtyRateUseCase {
  constructor(private readonly rateRepository: SpecialtyRateRepositoryPort) {}

  async execute(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new Error('Rate id cannot be empty');
    }
    await this.rateRepository.delete(id.trim());
  }
}
