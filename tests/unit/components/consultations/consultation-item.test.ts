import { describe, expect, it } from 'vitest';
import { Consultation } from '@/core/domain/entities/consultation.entity';
import { toConsultationItems } from '@/components/consultations/consultation-item';

function buildConsultation(): Consultation {
  return Consultation.create({
    id: 'consultation-1',
    date: '2026-10-30',
    patientName: '  Ana Pérez ',
    patientCedula: 'V-12345678',
    patientPhone: '04141234567',
    patientAddress: 'Av. Bolívar',
    doctorName: 'Dr. Luis Gómez',
    specialty: 'Pediatría',
    amountPointBs: 200,
    amountMobileBs: 100,
    amountCashBs: 0,
    bcvRate: 36.5,
    amountUsd: 8.22,
    status: 'COMPLETO',
    exonerationPercent: 0,
    exoneratedAmountUsd: 0,
    observations: '  Trae referencia  ',
    importHash: '2026-10-30_v-12345678_dr. luis gómez_pediatría',
  });
}

describe('toConsultationItems', () => {
  it('maps every rendered column of the entity', () => {
    const [item] = toConsultationItems([buildConsultation()]);

    expect(item).toStrictEqual({
      id: 'consultation-1',
      date: '2026-10-30',
      patientName: 'Ana Pérez',
      patientCedula: 'V-12345678',
      patientPhone: '04141234567',
      patientAddress: 'Av. Bolívar',
      doctorName: 'Dr. Luis Gómez',
      specialty: 'Pediatría',
      amountPointBs: 200,
      amountMobileBs: 100,
      amountCashBs: 0,
      bcvRate: 36.5,
      amountUsd: 8.22,
      totalBs: 300,
      status: 'COMPLETO',
      exonerationPercent: 0,
      exoneratedAmountUsd: 0,
      observations: 'Trae referencia',
    });
  });

  it('does not leak persistence-only fields to the client', () => {
    const [item] = toConsultationItems([buildConsultation()]);

    expect(Object.keys(item).sort()).toStrictEqual([
      'amountCashBs',
      'amountMobileBs',
      'amountPointBs',
      'amountUsd',
      'bcvRate',
      'date',
      'doctorName',
      'exoneratedAmountUsd',
      'exonerationPercent',
      'id',
      'observations',
      'patientAddress',
      'patientCedula',
      'patientName',
      'patientPhone',
      'specialty',
      'status',
      'totalBs',
    ]);
  });
});
