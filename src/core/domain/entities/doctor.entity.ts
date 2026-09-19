import crypto from 'node:crypto';

export interface DoctorProps {
  id?: string;
  name: string;
  specialty?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Doctor {
  readonly id: string;
  private _name: string;
  private _specialty: string;
  private _isActive: boolean;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: DoctorProps) {
    const trimmedName = props.name ? props.name.trim() : '';
    if (!trimmedName) {
      throw new Error('Doctor name cannot be empty');
    }

    this.id = props.id || crypto.randomUUID();
    this._name = trimmedName;
    this._specialty = props.specialty?.trim() || 'General';
    this._isActive = props.isActive ?? true;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(props: DoctorProps): Doctor {
    return new Doctor(props);
  }

  get name(): string {
    return this._name;
  }

  get specialty(): string {
    return this._specialty;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  updateDetails(name: string, specialty?: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Doctor name cannot be empty');
    }
    this._name = trimmed;
    if (specialty !== undefined) {
      this._specialty = specialty.trim() || 'General';
    }
    this._updatedAt = new Date();
  }
}
