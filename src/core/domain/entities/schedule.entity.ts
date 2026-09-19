import { generateEntityId, IdGenerator } from '@/core/domain/id-generator';
import { assertValidTimeRange } from '@/core/domain/validation/time-range';

export interface WeeklyScheduleProps {
  id?: string;
  doctorId: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  createdAt?: Date;
  updatedAt?: Date;
}

export class WeeklySchedule {
  readonly id: string;
  readonly doctorId: string;
  readonly dayOfWeek: number;
  private _startTime: string;
  private _endTime: string;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: WeeklyScheduleProps, generateId: IdGenerator) {
    if (!props.doctorId || !props.doctorId.trim()) {
      throw new Error('Doctor ID cannot be empty');
    }

    if (!Number.isInteger(props.dayOfWeek) || props.dayOfWeek < 0 || props.dayOfWeek > 6) {
      throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    }

    assertValidTimeRange(props.startTime, props.endTime);

    this.id = props.id || generateId();
    this.doctorId = props.doctorId;
    this.dayOfWeek = props.dayOfWeek;
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(props: WeeklyScheduleProps, generateId: IdGenerator = generateEntityId): WeeklySchedule {
    return new WeeklySchedule(props, generateId);
  }

  get startTime(): string {
    return this._startTime;
  }

  get endTime(): string {
    return this._endTime;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateTimeRange(startTime: string, endTime: string): void {
    assertValidTimeRange(startTime, endTime);

    this._startTime = startTime;
    this._endTime = endTime;
    this._updatedAt = new Date();
  }
}
