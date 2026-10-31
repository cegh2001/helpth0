import {
  MedicalExamFilter,
  MedicalExamRepository,
} from '@/core/domain/repositories/medical-exam.repository';
import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';

export class GetMedicalExamsUseCase {
  constructor(private readonly examRepository: MedicalExamRepository) {}

  async execute(filter?: MedicalExamFilter): Promise<MedicalExam[]> {
    return this.examRepository.findMany(filter);
  }
}
