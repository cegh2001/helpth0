import { describe, expect, it } from 'vitest';
import {
  computeMedicalExamImportHash,
  MedicalExam,
} from '@/core/domain/entities/medical-exam.entity';

describe('MedicalExam Entity', () => {
  it('creates a valid medical exam and computes totalBs when not given', () => {
    const exam = MedicalExam.create({
      date: '2026-09-28',
      patientName: 'Zoraida Fernandez',
      patientCedula: '11639560',
      patientBirthDate: '1973-03-28',
      patientPhone: '4149211060',
      patientAddress: 'Caraballeda',
      amountPointBs: 37067.41,
      amountMobileBs: 0,
      amountCashBs: 0,
      bcvRate: 857.05,
      amountUsd: 86.5,
      status: 'EXONERADO 50%',
      observations: 'EXONERADO 50%',
    });

    expect(exam.id.length).toBeGreaterThan(0);
    expect(exam.totalBs).toBe(37067.41);
    expect(exam.status).toBe('EXONERADO 50%');
    expect(exam.importHash).toBe(
      '2026-09-28_11639560_4149211060_86.50_exonerado 50%'
    );
  });

  it('uses patient name when patient has no cedula', () => {
    const exam = MedicalExam.create({
      date: '2026-10-13',
      patientName: 'Soledad Paraco',
      patientCedula: null,
      patientPhone: null,
      amountUsd: 0,
      status: 'COMPLETO',
    });

    expect(exam.importHash).toBe(
      '2026-10-13_soledad paraco__0.00_'
    );
  });

  it('generates consistent hashes regardless of whitespace and casing', () => {
    const hash1 = computeMedicalExamImportHash(
      '2026-10-01',
      ' 6487711 ',
      ' 414-1234567 ',
      15.0,
      ' COMPLETO '
    );
    const hash2 = computeMedicalExamImportHash(
      '2026-10-01',
      '6487711',
      '4141234567',
      15,
      'completo'
    );

    expect(hash1).toBe(hash2);
  });

  it('rejects an invalid calendar date', () => {
    expect(() =>
      MedicalExam.create({
        date: 'invalid-date',
        patientName: 'Carlos Lopez',
      })
    ).toThrow();
  });

  it('rejects empty patient name', () => {
    expect(() =>
      MedicalExam.create({
        date: '2026-10-01',
        patientName: '   ',
      })
    ).toThrow('Patient name cannot be empty');
  });
});
