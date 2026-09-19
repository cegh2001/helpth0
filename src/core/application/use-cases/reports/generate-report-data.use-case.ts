import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';
import { ClinicReportData, DoctorReportRow } from '@/core/application/ports/report-exporter.port';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface GenerateReportDTO {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export class GenerateReportDataUseCase {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly countRepository: DailyCountRepository
  ) {}

  async execute(dto: GenerateReportDTO): Promise<ClinicReportData> {
    if (dto.startDate > dto.endDate) {
      throw new Error('Start date cannot be after end date');
    }

    const doctors = await this.doctorRepository.findAll();
    const periodCounts = await this.countRepository.findByDateRange(dto.startDate, dto.endDate);

    let clinicTotal = 0;
    const doctorRows: DoctorReportRow[] = [];

    for (const doc of doctors) {
      const schedules = await this.scheduleRepository.findByDoctorId(doc.id);
      const schedulesSummary = schedules
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
        .map((s) => `${DAY_NAMES[s.dayOfWeek]}: ${s.startTime}-${s.endTime}`)
        .join(', ') || 'No fixed schedule';

      const docCounts = periodCounts
        .filter((c) => c.doctorId === doc.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const docTotal = docCounts.reduce((acc, curr) => acc + curr.patientCount, 0);
      clinicTotal += docTotal;

      doctorRows.push({
        doctorId: doc.id,
        doctorName: doc.name,
        specialty: doc.specialty,
        schedulesSummary,
        totalPatients: docTotal,
        dailyBreakdown: docCounts.map((c) => ({
          date: c.date,
          count: c.patientCount,
          notes: c.notes,
        })),
      });
    }

    return {
      startDate: dto.startDate,
      endDate: dto.endDate,
      generatedAt: new Date(),
      totalPatientsPeriod: clinicTotal,
      doctors: doctorRows,
    };
  }
}
