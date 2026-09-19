import { generateEntityId, IdGenerator } from '@/core/domain/id-generator';
import { assertValidCalendarDate } from '@/core/domain/validation/calendar-date';
import { assertValidTimeRange } from '@/core/domain/validation/time-range';

export interface DailyPatientCountProps {
  id?: string;
  doctorId: string;
  scheduleId?: string | null;
  scheduleStartTime?: string | null;
  scheduleEndTime?: string | null;
  date: string; // YYYY-MM-DD
  patientCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DailyPatientCount {
  readonly id: string;
  readonly doctorId: string;
  readonly scheduleId: string | null;
  readonly scheduleStartTime: string | null;
  readonly scheduleEndTime: string | null;
  readonly date: string;
  private _patientCount: number;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: DailyPatientCountProps, generateId: IdGenerator) {
    if (!props.doctorId || !props.doctorId.trim()) {
      throw new Error('Doctor ID cannot be empty');
    }

    assertValidCalendarDate(props.date);

    if (!Number.isInteger(props.patientCount)) {
      throw new Error('Patient count must be an integer');
    }

    if (props.patientCount < 0) {
      throw new Error('Patient count cannot be negative');
    }

    const hasSnapshotStart = props.scheduleStartTime != null;
    const hasSnapshotEnd = props.scheduleEndTime != null;
    if (hasSnapshotStart !== hasSnapshotEnd) {
      throw new Error('Schedule snapshot requires both start and end times');
    }
    if (hasSnapshotStart && hasSnapshotEnd) {
      assertValidTimeRange(props.scheduleStartTime!, props.scheduleEndTime!);
    }

    this.id = props.id || generateId();
    this.doctorId = props.doctorId;
    this.scheduleId = props.scheduleId ?? null;
    this.scheduleStartTime = props.scheduleStartTime ?? null;
    this.scheduleEndTime = props.scheduleEndTime ?? null;
    this.date = props.date;
    this._patientCount = props.patientCount;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(
    props: DailyPatientCountProps,
    generateId: IdGenerator = generateEntityId
  ): DailyPatientCount {
    return new DailyPatientCount(props, generateId);
  }

  get patientCount(): number {
    return this._patientCount;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateCount(newCount: number): void {
    if (!Number.isInteger(newCount)) {
      throw new Error('Patient count must be an integer');
    }

    if (newCount < 0) {
      throw new Error('Patient count cannot be negative');
    }

    this._patientCount = newCount;
    this._updatedAt = new Date();
  }
}
