import {
  ConsultationFilter,
  ConsultationRepository,
} from '@/core/domain/repositories/consultation.repository';
import { Consultation } from '@/core/domain/entities/consultation.entity';

export class GetConsultationsUseCase {
  constructor(private readonly consultationRepository: ConsultationRepository) {}

  /**
   * Returns consultations in reverse chronological order (newest first) for table views,
   * preserving the repository's ascending chronological order for Excel exports.
   */
  async execute(filter?: ConsultationFilter): Promise<Consultation[]> {
    const consultations = await this.consultationRepository.findMany(filter);
    return [...consultations].reverse();
  }
}
