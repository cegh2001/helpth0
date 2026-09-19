import crypto from 'node:crypto';

export interface WeeklyScheduleProps {
  id?: string;
  doctorId: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  createdAt?: Date;
  updatedAt?: Date;
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class WeeklySchedule {
  readonly id: string;
  readonly doctorId: string;
  readonly dayOfWeek: number;
  private _startTime: string;
  private _endTime: string;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: WeeklyScheduleProps) {
    if (!props.doctorId || !props.doctorId.trim()) {
      throw new Error('Doctor ID cannot be empty');
    }

    if (!Number.isInteger(props.dayOfWeek) || props.dayOfWeek < 0 || props.dayOfWeek > 6) {
      throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    }

    if (!TIME_REGEX.test(props.startTime) || !TIME_REGEX.test(props.endTime)) {
      throw new Error('Time must be in HH:mm 24-hour format');
    }

    if (props.endTime <= props.startTime) {
      throw new Error('End time must be after start time');
    }

    this.id = props.id || crypto.randomUUID();
    this.doctorId = props.doctorId;
    this.dayOfWeek = props.dayOfWeek;
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(props: WeeklyScheduleProps): WeeklySchedule {
    return new WeeklySchedule(props);
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
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      throw new Error('Time must be in HH:mm 24-hour format');
    }

    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }

    this._startTime = startTime;
    this._endTime = endTime;
    this._updatedAt = new Date();
  }
}
