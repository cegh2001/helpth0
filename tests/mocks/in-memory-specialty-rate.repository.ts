import { SpecialtyRate } from '@/core/domain/entities/specialty-rate.entity';
import { SpecialtyRateRepositoryPort } from '@/core/application/ports/specialty-rate-repository.port';

export class InMemorySpecialtyRateRepository implements SpecialtyRateRepositoryPort {
  private rates: Map<string, SpecialtyRate> = new Map();

  async findAll(): Promise<SpecialtyRate[]> {
    return Array.from(this.rates.values()).sort((a, b) =>
      a.specialty.localeCompare(b.specialty)
    );
  }

  async findBySpecialty(specialty: string): Promise<SpecialtyRate | null> {
    const norm = specialty.trim().toLowerCase();
    for (const r of this.rates.values()) {
      if (r.specialty.trim().toLowerCase() === norm) {
        return r;
      }
    }
    return null;
  }

  async upsert(rate: SpecialtyRate): Promise<SpecialtyRate> {
    const existing = await this.findBySpecialty(rate.specialty);
    const key = existing ? existing.id : rate.id;
    const toSave = SpecialtyRate.reconstruct({
      id: key,
      specialty: rate.specialty,
      standardRateUsd: rate.standardRateUsd,
      createdAt: existing ? existing.createdAt : rate.createdAt,
      updatedAt: new Date(),
    });
    this.rates.set(key, toSave);
    return toSave;
  }

  async delete(id: string): Promise<void> {
    this.rates.delete(id);
  }

  // Helper for test setups
  seed(rates: SpecialtyRate[]): void {
    this.rates.clear();
    for (const r of rates) {
      this.rates.set(r.id, r);
    }
  }
}
