import { Doctor } from '@/core/domain/entities/doctor.entity';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';

export class InMemoryDoctorRepository implements DoctorRepository {
  public doctors: Map<string, Doctor> = new Map();

  async save(doctor: Doctor): Promise<void> {
    this.doctors.set(doctor.id, doctor);
  }

  async findById(id: string): Promise<Doctor | null> {
    return this.doctors.get(id) || null;
  }

  async findAll(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }

  async findActive(): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).filter((d) => d.isActive);
  }
}
