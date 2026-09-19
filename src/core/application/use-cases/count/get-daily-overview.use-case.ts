import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';

export interface DoctorDailyOverviewDTO {
  doctorId: string;
  doctorName: string;
  specialty: string;
  scheduledToday: boolean;
  schedules: Array<{
    startTime: string;
    endTime: string;
  }>;
  patientCount: number;
  notes: string | null;
  countRecordId: string | null;
}

export interface DailyOverviewResponseDTO {
  date: string;
  dayOfWeek: number;
  totalPatientsToday: number;
  doctors: DoctorDailyOverviewDTO[];
}

export class GetDailyOverviewUseCase {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly countRepository: DailyCountRepository
  ) {}

  async execute(date: string): Promise<DailyOverviewResponseDTO> {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dateObj.getUTCDay();

    const activeDoctors = await this.doctorRepository.findActive();
    const daySchedules = await this.scheduleRepository.findByDayOfWeek(dayOfWeek);
    const dayCounts = await this.countRepository.findByDate(date);

    let totalPatients = 0;

    const doctorOverviews: DoctorDailyOverviewDTO[] = activeDoctors.map((doc) => {
      const docSchedules = daySchedules
        .filter((s) => s.doctorId === doc.id)
        .map((s) => ({ startTime: s.startTime, endTime: s.endTime }));

      const countRecord = dayCounts.find((c) => c.doctorId === doc.id);
      const count = countRecord ? countRecord.patientCount : 0;
      totalPatients += count;

      return {
        doctorId: doc.id,
        doctorName: doc.name,
        specialty: doc.specialty,
        scheduledToday: docSchedules.length > 0,
        schedules: docSchedules,
        patientCount: count,
        notes: countRecord?.notes || null,
        countRecordId: countRecord?.id || null,
      };
    });

    return {
      date,
      dayOfWeek,
      totalPatientsToday: totalPatients,
      doctors: doctorOverviews,
    };
  }
}
