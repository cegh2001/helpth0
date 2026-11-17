import {
  MedicalExamFilter,
  MedicalExamRepository,
} from '@/core/domain/repositories/medical-exam.repository';
import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';

export class GetMedicalExamsUseCase {
  constructor(private readonly examRepository: MedicalExamRepository) {}

  /**
   * Returns medical exams in reverse chronological order (newest first) for table views,
   * preserving the repository's ascending chronological order for Excel exports.
   */
  async execute(filter?: MedicalExamFilter): Promise<MedicalExam[]> {
    const exams = await this.examRepository.findMany(filter);
    return [...exams].reverse();
  }
}
