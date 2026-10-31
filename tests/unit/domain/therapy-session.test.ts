import { describe, expect, it } from 'vitest';
import {
  computeTherapyImportHash,
  TherapySession,
} from '@/core/domain/entities/therapy-session.entity';

const BASE = {
  date: '2026-09-09',
  therapistName: 'LIC JOHANNA RAMETA',
  specialty: 'TERAPIA OCUPACIONAL',
  sessionIndex: 3,
  bcvRate: 820.1,
  amountUsd: 15,
};

describe('TherapySession Entity', () => {
  it('derives the billed Bs total from the dollar amount when nothing was paid in Bs', () => {
    const session = TherapySession.create({ ...BASE, observations: 'COMPLETO' });

    expect(session.totalBs).toBe(12301.5);
    expect(session.amountUsd).toBe(15);
    expect(session.amountPointBs + session.amountMobileBs + session.amountCashBs).toBe(0);
  });

  it('keeps Bs payments as the billed total when the sheet reports them', () => {
    const session = TherapySession.create({
      ...BASE,
      amountPointBs: 4000,
      amountCashBs: 1000,
      amountUsd: 6.1,
    });

    expect(session.totalBs).toBe(5000);
  });

  it('respects an explicit total over any derivation', () => {
    const session = TherapySession.create({ ...BASE, totalBs: 999 });

    expect(session.totalBs).toBe(999);
  });

  it('derives the weekday name from the date instead of trusting the workbook column', () => {
    const septemberEleventh = TherapySession.create({
      ...BASE,
      date: '2026-09-11',
      observations: 'COMPLETO',
    });
    const septemberNinth = TherapySession.create({ ...BASE, date: '2026-09-09' });

    expect(septemberEleventh.dayOfWeekName).toBe('VIERNES');
    expect(septemberNinth.dayOfWeekName).toBe('MIERCOLES');
  });

  it('builds an identity hash from date, therapist, specialty and session index only', () => {
    const original = TherapySession.create({ ...BASE, observations: 'COMPLETO' });
    const withEditedObservation = TherapySession.create({
      ...BASE,
      amountUsd: 22.5,
      observations: 'COMIENZO EL DIA MIERCOLES',
    });
    const nextSession = TherapySession.create({ ...BASE, sessionIndex: 4 });

    expect(original.importHash).toBe('2026-09-09_lic johanna rameta_terapia ocupacional_3');
    expect(withEditedObservation.importHash).toBe(original.importHash);
    expect(nextSession.importHash).not.toBe(original.importHash);
  });

  it('normalizes casing and whitespace so re-imports stay idempotent', () => {
    const first = computeTherapyImportHash(
      ' 2026-09-09 ',
      '  lic   johanna   rameta ',
      'Terapia Ocupacional',
      3
    );
    const second = computeTherapyImportHash(
      '2026-09-09',
      'LIC JOHANNA RAMETA',
      'TERAPIA OCUPACIONAL',
      3
    );

    expect(first).toBe(second);
  });

  it('separates two specialties served by the same therapist on the same day', () => {
    const physiotherapy = TherapySession.create({
      ...BASE,
      date: '2026-09-29',
      specialty: 'FISIOTERAPEUTA',
      sessionIndex: 1,
    });
    const occupational = TherapySession.create({
      ...BASE,
      date: '2026-09-29',
      specialty: 'TERAPIA OCUPACIONAL',
      sessionIndex: 4,
    });

    expect(physiotherapy.importHash).not.toBe(occupational.importHash);
  });

  it('rejects an invalid calendar date', () => {
    expect(() => TherapySession.create({ ...BASE, date: '2026-02-30' })).toThrow(
      'Date must be a valid calendar date'
    );
  });

  it('rejects a blank therapist, a blank specialty and a non positive session index', () => {
    expect(() => TherapySession.create({ ...BASE, therapistName: '   ' })).toThrow(
      'Therapist name cannot be empty'
    );
    expect(() => TherapySession.create({ ...BASE, specialty: '  ' })).toThrow(
      'Therapy specialty cannot be empty'
    );
    expect(() => TherapySession.create({ ...BASE, sessionIndex: 0 })).toThrow(
      'Session index must be a positive integer'
    );
  });

  it('defaults to COMPLETO and clamps the exoneration percentage', () => {
    const session = TherapySession.create({ ...BASE, exonerationPercent: 140 });
    const plain = TherapySession.create({ ...BASE });

    expect(session.exonerationPercent).toBe(100);
    expect(plain.status).toBe('COMPLETO');
    expect(plain.observations).toBeNull();
  });

  it('keeps free-text observations out of the closed status vocabulary', () => {
    const session = TherapySession.create({
      ...BASE,
      status: 'COMIENZO EL DIA MIERCOLES',
      observations: 'COMIENZO EL DIA MIERCOLES',
    });

    expect(session.status).toBe('COMPLETO');
    expect(session.observations).toBe('COMIENZO EL DIA MIERCOLES');
  });

  it('derives the status from the exoneration percentage over any supplied label', () => {
    const half = TherapySession.create({
      ...BASE,
      status: 'COMPLETO',
      exonerationPercent: 50,
    });
    const full = TherapySession.create({ ...BASE, exonerationPercent: 100 });
    const pending = TherapySession.create({ ...BASE, status: 'PENDIENTE DE PAGO' });

    expect(half.status).toBe('EXONERADO 50%');
    expect(full.status).toBe('EXONERADO 100%');
    expect(pending.status).toBe('PENDIENTE DE PAGO');
  });
});
