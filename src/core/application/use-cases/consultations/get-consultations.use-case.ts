import {
  ConsultationFilter,
  ConsultationRepository,
} from '@/core/domain/repositories/consultation.repository';
import { Consultation } from '@/core/domain/entities/consultation.entity';

export class GetConsultationsUseCase {
  constructor(private readonly consultationRepository: ConsultationRepository) {}

  async execute(filter?: ConsultationFilter): Promise<Consultation[]> {
    return this.consultationRepository.findMany(filter);
  }
}
