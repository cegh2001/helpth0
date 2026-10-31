export interface ScheduleItem {
  startTime: string;
  endTime: string;
}

export interface DoctorShiftSlot {
  scheduleId: string | null;
  startTime: string;
  endTime: string;
  patientCount: number;
  countRecordId: string | null;
}

export interface DoctorOverview {
  doctorId: string;
  doctorName: string;
  specialty: string;
  scheduledToday: boolean;
  schedules: ScheduleItem[];
  shiftSlots?: DoctorShiftSlot[];
  patientCount: number;
  countRecordId: string | null;
}

export interface DailyOverviewData {
  date: string;
  dayOfWeek: number;
  totalPatientsToday: number;
  doctors: DoctorOverview[];
}

export function filterDoctorsByQuery(
  doctors: DoctorOverview[],
  query: string
): DoctorOverview[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return doctors;
  return doctors.filter(
    (doctor) =>
      doctor.doctorName.toLowerCase().includes(needle) ||
      doctor.specialty.toLowerCase().includes(needle)
  );
}
