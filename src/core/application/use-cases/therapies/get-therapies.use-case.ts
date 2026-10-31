import {
  TherapyFilter,
  TherapyRepository,
} from '@/core/domain/repositories/therapy.repository';
import { TherapySession } from '@/core/domain/entities/therapy-session.entity';

export class GetTherapiesUseCase {
  constructor(private readonly therapyRepository: TherapyRepository) {}

  async execute(filter?: TherapyFilter): Promise<TherapySession[]> {
    return this.therapyRepository.findMany(filter);
  }
}
