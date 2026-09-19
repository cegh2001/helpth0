import { describe, it, expect } from 'vitest';
import { DailyPatientCount } from '@/core/domain/entities/daily-count.entity';

describe('DailyPatientCount Entity', () => {
  it('should create a valid daily patient count record', () => {
    const record = DailyPatientCount.create({
      doctorId: 'doc-123',
      date: '2026-09-18',
      patientCount: 15,
      notes: 'Busy morning shift',
    });

    expect(record.id).toBeDefined();
    expect(record.doctorId).toBe('doc-123');
    expect(record.date).toBe('2026-09-18');
    expect(record.patientCount).toBe(15);
    expect(record.notes).toBe('Busy morning shift');
  });

  it('should allow updating the patient count', () => {
    const record = DailyPatientCount.create({
      doctorId: 'doc-123',
      date: '2026-09-18',
      patientCount: 10,
    });

    record.updateCount(18);
    expect(record.patientCount).toBe(18);
  });

  it('should throw an error for negative patient count', () => {
    expect(() => {
      DailyPatientCount.create({
        doctorId: 'doc-123',
        date: '2026-09-18',
        patientCount: -1,
      });
    }).toThrowError('Patient count cannot be negative');
  });

  it('should throw an error for non-integer patient count', () => {
    expect(() => {
      DailyPatientCount.create({
        doctorId: 'doc-123',
        date: '2026-09-18',
        patientCount: 3.5,
      });
    }).toThrowError('Patient count must be an integer');
  });

  it('should throw an error for invalid date format', () => {
    expect(() => {
      DailyPatientCount.create({
        doctorId: 'doc-123',
        date: '18/09/2026',
        patientCount: 5,
      });
    }).toThrowError('Date must be in YYYY-MM-DD format');
  });
});
