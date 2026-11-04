import { SpecialtyRate } from '@/core/domain/entities/specialty-rate.entity';

export interface SpecialtyRateRepository {
  findAll(): Promise<SpecialtyRate[]>;
  findBySpecialty(specialty: string): Promise<SpecialtyRate | null>;
  upsert(rate: SpecialtyRate): Promise<SpecialtyRate>;
  delete(id: string): Promise<void>;
}

export type SpecialtyRateRepositoryPort = SpecialtyRateRepository;
