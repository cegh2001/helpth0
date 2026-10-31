import { TherapySession } from '@/core/domain/entities/therapy-session.entity';

export interface TherapyExporterPort {
  exportToExcel(sessions: TherapySession[], titlePeriod?: string): Promise<Buffer>;
}
