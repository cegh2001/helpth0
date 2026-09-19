import { describe, it, expect } from 'vitest';
import { Doctor } from '@/core/domain/entities/doctor.entity';

describe('Doctor Entity', () => {
  it('should create a valid doctor entity', () => {
    const doctor = Doctor.create({
      name: 'Dr. Gregory House',
      specialty: 'Diagnostic Medicine',
    });

    expect(doctor.id).toBeDefined();
    expect(doctor.name).toBe('Dr. Gregory House');
    expect(doctor.specialty).toBe('Diagnostic Medicine');
    expect(doctor.isActive).toBe(true);
  });

  it('should throw an error if doctor name is empty', () => {
    expect(() => {
      Doctor.create({
        name: '   ',
        specialty: 'Pediatrics',
      });
    }).toThrowError('Doctor name cannot be empty');
  });

  it('should default specialty to General if not provided', () => {
    const doctor = Doctor.create({
      name: 'Dr. John Watson',
    });

    expect(doctor.specialty).toBe('General');
  });

  it('should allow deactivating and activating a doctor', () => {
    const doctor = Doctor.create({
      name: 'Dr. Strange',
    });

    doctor.deactivate();
    expect(doctor.isActive).toBe(false);

    doctor.activate();
    expect(doctor.isActive).toBe(true);
  });
});
