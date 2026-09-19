import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { DoctorResponseDTO } from './register-doctor.use-case';

export class ListDoctorsUseCase {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async execute(onlyActive = true): Promise<DoctorResponseDTO[]> {
    const doctors = onlyActive
      ? await this.doctorRepository.findActive()
      : await this.doctorRepository.findAll();

    return doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      isActive: d.isActive,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }
}
