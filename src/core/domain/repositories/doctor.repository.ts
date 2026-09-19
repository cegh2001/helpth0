import { Doctor } from '../entities/doctor.entity';

export interface DoctorRepository {
  save(doctor: Doctor): Promise<void>;
  findById(id: string): Promise<Doctor | null>;
  findAll(): Promise<Doctor[]>;
  findActive(): Promise<Doctor[]>;
  delete(id: string): Promise<void>;
}
