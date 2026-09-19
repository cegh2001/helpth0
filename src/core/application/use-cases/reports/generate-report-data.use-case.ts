import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';
import { ClinicReportData, DoctorReportRow } from '@/core/application/ports/report-exporter.port';
import {
  assertValidCalendarDateRange,
  getCalendarDayOfWeek,
} from '@/core/domain/validation/calendar-date';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
    assertValidCalendarDateRange(dto.startDate, dto.endDate);

    const doctors = await this.doctorRepository.findAll();
    const periodCounts = await this.countRepository.findByDateRange(dto.startDate, dto.endDate);

    let clinicTotal = 0;
    const doctorRows: DoctorReportRow[] = [];

    for (const doc of doctors) {
      const schedules = await this.scheduleRepository.findByDoctorId(doc.id);
      const schedulesSummary =
        schedules
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
          .map((s) => `${DAY_NAMES[s.dayOfWeek]}: ${s.startTime}-${s.endTime}`)
          .join(', ') || 'Sin turnos fijos';

      const docCounts = periodCounts
        .filter((c) => c.doctorId === doc.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const docTotal = docCounts.reduce((acc, curr) => acc + curr.patientCount, 0);
      clinicTotal += docTotal;

      const dailyBreakdown = docCounts.map((c) => {
        const dayOfWeek = getCalendarDayOfWeek(c.date);
        const dayName = DAY_NAMES[dayOfWeek];
        const shiftTime = c.scheduleStartTime && c.scheduleEndTime
          ? `${c.scheduleStartTime} - ${c.scheduleEndTime}`
          : 'Horario histórico no disponible';

        return {
          date: c.date,
          dayName,
          shiftTime,
          count: c.patientCount,
        };
      });

      doctorRows.push({
        doctorId: doc.id,
        doctorName: doc.name,
        specialty: doc.specialty,
        schedulesSummary,
        totalPatients: docTotal,
        dailyBreakdown,
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
