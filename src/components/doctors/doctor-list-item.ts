import type { DoctorResponseDTO } from '@/core/application/use-cases/doctor/register-doctor.use-case';

export interface DoctorListItem {
  id: string;
  name: string;
  specialty: string;
}

/**
 * The use case returns timestamps and the activation flag; the directory only
 * renders three columns, so the client payload carries exactly those.
 */
export function toDoctorListItems(doctors: DoctorResponseDTO[]): DoctorListItem[] {
  return doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialty,
  }));
}
