import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';

export interface MedicalExamExporterPort {
  exportToExcel(exams: MedicalExam[], titlePeriod?: string): Promise<Buffer>;
}
