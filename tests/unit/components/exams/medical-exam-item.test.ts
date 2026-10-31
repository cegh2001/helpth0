import { describe, expect, it } from 'vitest';
import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';
import { toMedicalExamItems } from '@/components/exams/medical-exam-item';

function buildExam(): MedicalExam {
  return MedicalExam.create({
    id: 'exam-1',
    date: '2026-10-30',
    patientName: ' Ana Pérez ',
    patientCedula: 'V-12345678',
    patientBirthDate: '1990-05-01',
    patientPhone: '04141234567',
    patientAddress: 'Av. Bolívar',
    examName: ' Hematología completa ',
    amountPointBs: 150,
    amountMobileBs: 0,
    amountCashBs: 50,
    bcvRate: 36.5,
    amountUsd: 5.48,
    status: 'COMPLETO',
    exonerationPercent: 100,
    exoneratedAmountUsd: 5.48,
    observations: null,
    importHash: '2026-10-30_v-12345678_04141234567_5.48_',
  });
}

describe('toMedicalExamItems', () => {
  it('maps every rendered column of the entity', () => {
    const [item] = toMedicalExamItems([buildExam()]);

    expect(item).toStrictEqual({
      id: 'exam-1',
      date: '2026-10-30',
      patientName: 'Ana Pérez',
      patientCedula: 'V-12345678',
      patientBirthDate: '1990-05-01',
      patientPhone: '04141234567',
      patientAddress: 'Av. Bolívar',
      examName: 'Hematología completa',
      amountPointBs: 150,
      amountMobileBs: 0,
      amountCashBs: 50,
      bcvRate: 36.5,
      amountUsd: 5.48,
      totalBs: 200,
      status: 'COMPLETO',
      exonerationPercent: 100,
      exoneratedAmountUsd: 5.48,
      observations: null,
    });
  });

  it('does not leak persistence-only fields to the client', () => {
    const [item] = toMedicalExamItems([buildExam()]);

    expect(Object.keys(item).sort()).toStrictEqual([
      'amountCashBs',
      'amountMobileBs',
      'amountPointBs',
      'amountUsd',
      'bcvRate',
      'date',
      'examName',
      'exoneratedAmountUsd',
      'exonerationPercent',
      'id',
      'observations',
      'patientAddress',
      'patientBirthDate',
      'patientCedula',
      'patientName',
      'patientPhone',
      'status',
      'totalBs',
    ]);
  });
});
