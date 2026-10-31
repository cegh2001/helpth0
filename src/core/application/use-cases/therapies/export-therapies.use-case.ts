import {
  TherapyFilter,
  TherapyRepository,
} from '@/core/domain/repositories/therapy.repository';
import { TherapyExporterPort } from '@/core/application/ports/therapy-exporter.port';

export class ExportTherapiesUseCase {
  constructor(
    private readonly therapyRepository: TherapyRepository,
    private readonly excelExporter: TherapyExporterPort
  ) {}

  async execute(filter?: TherapyFilter, titlePeriod?: string): Promise<Buffer> {
    const records = await this.therapyRepository.findMany(filter);
    return this.excelExporter.exportToExcel(records, titlePeriod);
  }
}
