import { describe, expect, it, beforeEach } from 'vitest';
import { InMemorySpecialtyRateRepository } from '../../mocks/in-memory-specialty-rate.repository';
import { GetSpecialtyRatesUseCase } from '@/core/application/use-cases/specialty-rates/get-specialty-rates.use-case';
import { SaveSpecialtyRateUseCase } from '@/core/application/use-cases/specialty-rates/save-specialty-rate.use-case';
import { DeleteSpecialtyRateUseCase } from '@/core/application/use-cases/specialty-rates/delete-specialty-rate.use-case';
import { SpecialtyRate } from '@/core/domain/entities/specialty-rate.entity';

describe('Specialty Rate Use Cases', () => {
  let repository: InMemorySpecialtyRateRepository;
  let getRatesUseCase: GetSpecialtyRatesUseCase;
  let saveRateUseCase: SaveSpecialtyRateUseCase;
  let deleteRateUseCase: DeleteSpecialtyRateUseCase;

  beforeEach(() => {
    repository = new InMemorySpecialtyRateRepository();
    getRatesUseCase = new GetSpecialtyRatesUseCase(repository);
    saveRateUseCase = new SaveSpecialtyRateUseCase(repository);
    deleteRateUseCase = new DeleteSpecialtyRateUseCase(repository);
  });

  it('returns default rate and empty list initially', async () => {
    const result = await getRatesUseCase.execute();

    expect(result.defaultRateUsd).toBe(10);
    expect(result.rates.length).toBe(0);
  });

  it('saves and updates a specialty rate', async () => {
    const saved = await saveRateUseCase.execute({
      specialty: 'Psicologia',
      standardRateUsd: 15,
    });

    expect(saved.specialty).toBe('Psicologia');
    expect(saved.standardRateUsd).toBe(15);

    const updated = await saveRateUseCase.execute({
      id: saved.id,
      specialty: 'Psicologia',
      standardRateUsd: 18,
    });

    expect(updated.id).toBe(saved.id);
    expect(updated.standardRateUsd).toBe(18);

    const result = await getRatesUseCase.execute();
    expect(result.rates.length).toBe(1);
    expect(result.rates[0].standardRateUsd).toBe(18);
  });

  it('deletes an existing specialty rate', async () => {
    const rate = SpecialtyRate.create({
      specialty: 'Cardiologia',
      standardRateUsd: 20,
    });
    repository.seed([rate]);

    let result = await getRatesUseCase.execute();
    expect(result.rates.length).toBe(1);

    await deleteRateUseCase.execute(rate.id);

    result = await getRatesUseCase.execute();
    expect(result.rates.length).toBe(0);
  });
});
