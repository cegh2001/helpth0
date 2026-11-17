import {
  TherapyFilter,
  TherapyRepository,
} from '@/core/domain/repositories/therapy.repository';
import { TherapySession } from '@/core/domain/entities/therapy-session.entity';

export class GetTherapiesUseCase {
  constructor(private readonly therapyRepository: TherapyRepository) {}

  /**
   * Returns therapy sessions in reverse chronological order (newest first) for table views,
   * preserving the repository's ascending chronological order for Excel exports.
   */
  async execute(filter?: TherapyFilter): Promise<TherapySession[]> {
    const sessions = await this.therapyRepository.findMany(filter);
    return [...sessions].reverse();
  }
}
