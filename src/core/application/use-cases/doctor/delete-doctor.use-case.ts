import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';

export class DeleteDoctorUseCase {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async execute(id: string): Promise<void> {
    const doctor = await this.doctorRepository.findById(id);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    await this.doctorRepository.delete(id);
  }
}
