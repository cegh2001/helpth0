import {
  ConsultationFilter,
  ConsultationRepository,
} from '@/core/domain/repositories/consultation.repository';
import { ConsultationExporterPort } from '@/core/application/ports/consultation-exporter.port';

export class ExportConsultationsUseCase {
  constructor(
    private readonly consultationRepository: ConsultationRepository,
    private readonly excelExporter: ConsultationExporterPort
  ) {}

  async execute(filter?: ConsultationFilter, titlePeriod?: string): Promise<Buffer> {
    const records = await this.consultationRepository.findMany(filter);
    return this.excelExporter.exportToExcel(records, titlePeriod);
  }
}
