import { Doctor } from '@/core/domain/entities/doctor.entity';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';

export interface RegisterDoctorDTO {
  name: string;
  specialty?: string;
}

export interface DoctorResponseDTO {
  id: string;
  name: string;
  specialty: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class RegisterDoctorUseCase {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async execute(dto: RegisterDoctorDTO): Promise<DoctorResponseDTO> {
    const doctor = Doctor.create({
      name: dto.name,
      specialty: dto.specialty,
    });

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
