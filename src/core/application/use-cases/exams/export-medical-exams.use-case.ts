import {
  MedicalExamFilter,
  MedicalExamRepository,
} from '@/core/domain/repositories/medical-exam.repository';
import { MedicalExamExporterPort } from '@/core/application/ports/medical-exam-exporter.port';

export class ExportMedicalExamsUseCase {
  constructor(
    private readonly examRepository: MedicalExamRepository,
    private readonly excelExporter: MedicalExamExporterPort
  ) {}

  async execute(filter?: MedicalExamFilter, titlePeriod?: string): Promise<Buffer> {
    const records = await this.examRepository.findMany(filter);
    return this.excelExporter.exportToExcel(records, titlePeriod);
  }
}
