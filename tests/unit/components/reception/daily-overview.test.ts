import { describe, expect, it } from 'vitest';
import { filterDoctorsByQuery, type DoctorOverview } from '@/components/reception/daily-overview';

function makeDoctor(name: string, specialty: string): DoctorOverview {
  return {
    doctorId: name.toLowerCase().replace(/\s+/g, '-'),
    doctorName: name,
    specialty,
    scheduledToday: false,
    schedules: [],
    patientCount: 0,
    countRecordId: null,
  };
}

const doctors = [
  makeDoctor('Dra. Ana Pérez', 'Pediatría'),
  makeDoctor('Dr. Luis Gómez', 'Traumatología'),
];

describe('filterDoctorsByQuery', () => {
  it('returns every doctor when the query is blank', () => {
    expect(filterDoctorsByQuery(doctors, '   ')).toBe(doctors);
  });

  it('matches the doctor name case-insensitively', () => {
    expect(filterDoctorsByQuery(doctors, 'ANA pérez')).toStrictEqual([doctors[0]]);
  });

  it('matches the specialty', () => {
    expect(filterDoctorsByQuery(doctors, 'traumato')).toStrictEqual([doctors[1]]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterDoctorsByQuery(doctors, 'cardiología')).toStrictEqual([]);
  });
});
