import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { ScheduleRepository } from '@/core/domain/repositories/schedule.repository';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';
import { getCalendarDayOfWeek } from '@/core/domain/validation/calendar-date';

export interface DoctorShiftSlotOverviewDTO {
  scheduleId: string | null;
  startTime: string;
  endTime: string;
  patientCount: number;
  countRecordId: string | null;
}

export interface DoctorDailyOverviewDTO {
  doctorId: string;
  doctorName: string;
  specialty: string;
  scheduledToday: boolean;
  schedules: Array<{
    id?: string;
    startTime: string;
    endTime: string;
  }>;
  shiftSlots: DoctorShiftSlotOverviewDTO[];
  patientCount: number;
  totalPatients: number;
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
    const dayOfWeek = getCalendarDayOfWeek(date);

    const activeDoctors = await this.doctorRepository.findActive();
    const daySchedules = await this.scheduleRepository.findByDayOfWeek(dayOfWeek);
    const dayCounts = await this.countRepository.findByDate(date);

    let totalPatients = 0;

    const doctorOverviews: DoctorDailyOverviewDTO[] = activeDoctors.map((doc) => {
      const docSchedules = daySchedules
        .filter((s) => s.doctorId === doc.id)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const docCounts = dayCounts.filter((c) => c.doctorId === doc.id);

      let shiftSlots: DoctorShiftSlotOverviewDTO[] = [];

      if (docSchedules.length > 0) {
        shiftSlots = docSchedules.map((s) => {
          const countRecord =
            docCounts.find((c) => c.scheduleId === s.id) ||
            (docSchedules.length === 1 ? docCounts.find((c) => !c.scheduleId) : undefined);

          return {
            scheduleId: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            patientCount: countRecord ? countRecord.patientCount : 0,
            countRecordId: countRecord?.id || null,
          };
        });

        // If there are unlinked extra counts
        const unlinked = docCounts.find(
          (c) => !c.scheduleId && !shiftSlots.some((slot) => slot.countRecordId === c.id)
        );
        if (unlinked && unlinked.patientCount > 0) {
          shiftSlots.push({
            scheduleId: null,
            startTime: '',
            endTime: '',
            patientCount: unlinked.patientCount,
            countRecordId: unlinked.id,
          });
        }
      } else {
        const generalCount = docCounts.find((c) => !c.scheduleId) || docCounts[0];
        shiftSlots = [
          {
            scheduleId: null,
            startTime: '',
            endTime: '',
            patientCount: generalCount ? generalCount.patientCount : 0,
            countRecordId: generalCount?.id || null,
          },
        ];
      }

      const docTotal = shiftSlots.reduce((sum, slot) => sum + slot.patientCount, 0);
      totalPatients += docTotal;

      return {
        doctorId: doc.id,
        doctorName: doc.name,
        specialty: doc.specialty,
        scheduledToday: docSchedules.length > 0,
        schedules: docSchedules.map((s) => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        shiftSlots,
        patientCount: docTotal,
        totalPatients: docTotal,
        countRecordId: shiftSlots[0]?.countRecordId || null,
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
