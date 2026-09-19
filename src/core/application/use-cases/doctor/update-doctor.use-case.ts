import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { DoctorResponseDTO } from './register-doctor.use-case';

export interface UpdateDoctorDTO {
  id: string;
  name: string;
  specialty?: string;
}

export class UpdateDoctorUseCase {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async execute(dto: UpdateDoctorDTO): Promise<DoctorResponseDTO> {
    const doctor = await this.doctorRepository.findById(dto.id);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    doctor.updateDetails(dto.name, dto.specialty);
    await this.doctorRepository.save(doctor);

    return {
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      isActive: doctor.isActive,
      createdAt: doctor.createdAt.toISOString(),
      updatedAt: doctor.updatedAt.toISOString(),
    };
  }
}
