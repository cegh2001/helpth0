import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';
import { ClinicReportData, DoctorReportRow } from '@/core/application/ports/report-exporter.port';

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
    if (dto.startDate > dto.endDate) {
      throw new Error('Start date cannot be after end date');
    }

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
        const [year, month, day] = c.date.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
        const dayName = DAY_NAMES[dayOfWeek];

        let shiftTime = 'Fuera de turno';
        if (c.scheduleId) {
          const matched = schedules.find((s) => s.id === c.scheduleId);
          if (matched) {
            shiftTime = `${matched.startTime} - ${matched.endTime}`;
          }
        } else {
          const dayScheds = schedules.filter((s) => s.dayOfWeek === dayOfWeek);
          if (dayScheds.length === 1) {
            shiftTime = `${dayScheds[0].startTime} - ${dayScheds[0].endTime}`;
          } else if (dayScheds.length > 1) {
            shiftTime = dayScheds.map((s) => `${s.startTime} - ${s.endTime}`).join(', ');
          }
        }

        return {
          date: c.date,
          dayName,
          shiftTime,
          count: c.patientCount,
          notes: c.notes,
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
