import { describe, expect, it } from 'vitest';
import {
  computeConsultationImportHash,
  Consultation,
} from '@/core/domain/entities/consultation.entity';

describe('Consultation Entity', () => {
  it('creates a valid consultation and computes totalBs when not given', () => {
    const consultation = Consultation.create({
      date: '2026-10-01',
      patientName: 'Leonardo Bolivar',
      patientCedula: '7996174',
      patientAddress: 'Caraballeda',
      patientPhone: '4127109167',
      doctorName: 'Dra Mailet Contrera',
      specialty: 'Traumatologia',
      amountPointBs: 4300.85,
      amountMobileBs: 0,
      amountCashBs: 0,
      bcvRate: 860.17,
      amountUsd: 5,
    });

    expect(consultation.id.length).toBeGreaterThan(0);
    expect(consultation.totalBs).toBe(4300.85);
    expect(consultation.status).toBe('COMPLETO');
    expect(consultation.importHash).toBe(
      '2026-10-01_7996174_dra mailet contrera_traumatologia'
    );
  });

  it('uses patient name in importHash when patient has no cedula', () => {
    const consultation = Consultation.create({
      date: '2026-10-13',
      patientName: 'Liam Perez',
      patientCedula: null,
      doctorName: 'Dr Gilberto Bracho',
      specialty: 'Pediatria',
      amountUsd: 5,
    });

    expect(consultation.importHash).toBe(
      '2026-10-13_liam perez_dr gilberto bracho_pediatria'
    );
  });

  it('generates consistent hashes regardless of extra whitespace and uppercase', () => {
    const hash1 = computeConsultationImportHash(
      '2026-10-01',
      ' 7996174 ',
      'DRA MAILET CONTRERA',
      'TRAUMATOLOGIA'
    );
    const hash2 = computeConsultationImportHash(
      '2026-10-01',
      '7996174',
      'dra mailet contrera',
      'traumatologia'
    );

    expect(hash1).toBe(hash2);
  });

  it('rejects an invalid date', () => {
    expect(() =>
      Consultation.create({
        date: 'invalid-date',
        patientName: 'Carlos Lopez',
        doctorName: 'Dra Contrera',
        specialty: 'Traumatologia',
      })
    ).toThrow();
  });

  it('rejects empty patient or doctor names', () => {
    expect(() =>
      Consultation.create({
        date: '2026-10-01',
        patientName: '   ',
        doctorName: 'Dra Contrera',
        specialty: 'Traumatologia',
      })
    ).toThrow('Patient name cannot be empty');

    expect(() =>
      Consultation.create({
        date: '2026-10-01',
        patientName: 'Carlos',
        doctorName: '   ',
        specialty: 'Traumatologia',
      })
    ).toThrow('Doctor name cannot be empty');
  });
});
