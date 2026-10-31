import { describe, expect, it } from 'vitest';
import { isPrismaClientCurrent } from '@/infrastructure/persistence/prisma/prisma-client-guard';

function fakeClient(delegates: string[]): object {
  return Object.fromEntries(delegates.map((name) => [name, {}]));
}

const CURRENT_DELEGATES = [
  'doctor',
  'schedule',
  'dailyCount',
  'user',
  'session',
  'account',
  'verification',
  'patient',
  'consultation',
  'medicalExam',
  'therapySession',
];

describe('isPrismaClientCurrent', () => {
  it('accepts a client that exposes every generated delegate', () => {
    expect(isPrismaClientCurrent(fakeClient(CURRENT_DELEGATES))).toBe(true);
  });

  it('rejects the stale client that predates the TherapySession model', () => {
    const stale = CURRENT_DELEGATES.filter((name) => name !== 'therapySession');

    expect(isPrismaClientCurrent(fakeClient(stale))).toBe(false);
  });

  it('rejects a client missing only the newest model', () => {
    const missingMedicalExam = CURRENT_DELEGATES.filter((name) => name !== 'medicalExam');

    expect(isPrismaClientCurrent(fakeClient(missingMedicalExam))).toBe(false);
  });
});
