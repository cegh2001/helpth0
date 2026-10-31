import { Consultation } from '@/core/domain/entities/consultation.entity';

export interface ConsultationExporterPort {
  exportToExcel(consultations: Consultation[], titlePeriod?: string): Promise<Buffer>;
}
