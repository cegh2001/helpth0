import { describe, expect, it } from 'vitest';
import { toDoctorListItems } from '@/components/doctors/doctor-list-item';

describe('toDoctorListItems', () => {
  it('keeps only the columns the directory renders', () => {
    const items = toDoctorListItems([
      {
        id: 'doctor-1',
        name: 'Dra. Ana Pérez',
        specialty: 'Pediatría',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-10-30T00:00:00.000Z',
      },
    ]);

    expect(items).toStrictEqual([
      { id: 'doctor-1', name: 'Dra. Ana Pérez', specialty: 'Pediatría' },
    ]);
  });

  it('returns an empty list for an empty source', () => {
    expect(toDoctorListItems([])).toStrictEqual([]);
  });
});
