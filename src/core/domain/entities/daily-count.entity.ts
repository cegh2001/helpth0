import crypto from 'node:crypto';

export interface DailyPatientCountProps {
  id?: string;
  doctorId: string;
  scheduleId?: string | null;
  date: string; // YYYY-MM-DD
  patientCount: number;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class DailyPatientCount {
  readonly id: string;
  readonly doctorId: string;
  readonly scheduleId: string | null;
  readonly date: string;
  private _patientCount: number;
  private _notes: string | null;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: DailyPatientCountProps) {
    if (!props.doctorId || !props.doctorId.trim()) {
      throw new Error('Doctor ID cannot be empty');
    }

    if (!props.date || !DATE_REGEX.test(props.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    if (!Number.isInteger(props.patientCount)) {
      throw new Error('Patient count must be an integer');
    }

    if (props.patientCount < 0) {
      throw new Error('Patient count cannot be negative');
    }

    this.id = props.id || crypto.randomUUID();
    this.doctorId = props.doctorId;
    this.scheduleId = props.scheduleId || null;
    this.date = props.date;
    this._patientCount = props.patientCount;
    this._notes = props.notes?.trim() || null;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(props: DailyPatientCountProps): DailyPatientCount {
    return new DailyPatientCount(props);
  }

  get patientCount(): number {
    return this._patientCount;
  }

  get notes(): string | null {
    return this._notes;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateCount(newCount: number, notes?: string | null): void {
    if (!Number.isInteger(newCount)) {
      throw new Error('Patient count must be an integer');
    }

    if (newCount < 0) {
      throw new Error('Patient count cannot be negative');
    }

    this._patientCount = newCount;
    if (notes !== undefined) {
      this._notes = notes?.trim() || null;
    }
    this._updatedAt = new Date();
  }
}
