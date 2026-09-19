import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';
import { DoctorRepository } from '@/core/domain/repositories/doctor.repository';
import { DailyCountRepository } from '@/core/domain/repositories/daily-count.repository';

export interface RecordPatientCountDTO {
  doctorId: string;
  date: string; // YYYY-MM-DD
  patientCount: number;
  notes?: string | null;
}

export interface PatientCountResponseDTO {
  id: string;
  doctorId: string;
  date: string;
  patientCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export class RecordPatientCountUseCase {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly countRepository: DailyCountRepository
  ) {}

  async execute(dto: RecordPatientCountDTO): Promise<PatientCountResponseDTO> {
    const doctor = await this.doctorRepository.findById(dto.doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    let record = await this.countRepository.findByDoctorAndDate(dto.doctorId, dto.date);

    if (record) {
      record.updateCount(dto.patientCount, dto.notes);
    } else {
      record = DailyPatientCount.create({
        doctorId: dto.doctorId,
        date: dto.date,
        patientCount: dto.patientCount,
        notes: dto.notes,
      });
    }

    await this.countRepository.save(record);

    return {
      id: record.id,
      doctorId: record.doctorId,
      date: record.date,
      patientCount: record.patientCount,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
