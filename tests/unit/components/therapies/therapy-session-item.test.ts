import { describe, expect, it } from 'vitest';
import { TherapySession } from '@/core/domain/entities/therapy-session.entity';
import { toTherapySessionItems } from '@/components/therapies/therapy-session-item';

function buildSession(): TherapySession {
  return TherapySession.create({
    id: 'session-1',
    date: '2026-10-30',
    therapistName: '  Lic. Ana Pérez  ',
    specialty: 'Fisioterapia',
    sessionIndex: 2,
    amountPointBs: 100,
    amountMobileBs: 50,
    amountCashBs: 0,
    bcvRate: 36.5,
    amountUsd: 10,
    status: 'COMPLETO',
    exonerationPercent: 25,
    exoneratedAmountUsd: 2.5,
    observations: '  Control mensual  ',
    importHash: '2026-10-30_lic. ana pérez_fisioterapia_2',
  });
}

describe('toTherapySessionItems', () => {
  it('maps every rendered column of the entity', () => {
    const [item] = toTherapySessionItems([buildSession()]);

    expect(item).toStrictEqual({
      id: 'session-1',
      date: '2026-10-30',
      therapistName: 'Lic. Ana Pérez',
      specialty: 'Fisioterapia',
      dayOfWeekName: 'VIERNES',
      sessionIndex: 2,
      amountPointBs: 100,
      amountMobileBs: 50,
      amountCashBs: 0,
      bcvRate: 36.5,
      amountUsd: 10,
      totalBs: 150,
      status: 'EXONERADO 25%',
      exonerationPercent: 25,
      exoneratedAmountUsd: 2.5,
      observations: 'Control mensual',
    });
  });

  it('does not leak persistence-only fields to the client', () => {
    const [item] = toTherapySessionItems([buildSession()]);

    expect(Object.keys(item).sort()).toStrictEqual([
      'amountCashBs',
      'amountMobileBs',
      'amountPointBs',
      'amountUsd',
      'bcvRate',
      'date',
      'dayOfWeekName',
      'exoneratedAmountUsd',
      'exonerationPercent',
      'id',
      'observations',
      'sessionIndex',
      'specialty',
      'status',
      'therapistName',
      'totalBs',
    ]);
  });

  it('returns an empty list for an empty source', () => {
    expect(toTherapySessionItems([])).toStrictEqual([]);
  });
});
