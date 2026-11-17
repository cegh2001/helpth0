import { describe, expect, it } from 'vitest';
import { InMemoryTherapyRepository } from '../../mocks/in-memory-therapy.repository';
import { TherapySession } from '@/core/domain/entities/therapy-session.entity';
import { GetTherapiesUseCase } from '@/core/application/use-cases/therapies/get-therapies.use-case';
import { ExportTherapiesUseCase } from '@/core/application/use-cases/therapies/export-therapies.use-case';
import { TherapyExporterPort } from '@/core/application/ports/therapy-exporter.port';
import { TherapyRepository } from '@/core/domain/repositories/therapy.repository';

function makeSession(
  id: string,
  date: string,
  therapistName: string,
  sessionIndex: number,
  specialty = 'FISIOTERAPIA'
): TherapySession {
  return TherapySession.create({
    id,
    date,
    therapistName,
    specialty,
    sessionIndex,
    amountUsd: 15,
    bcvRate: 820,
  });
}

describe('GetTherapiesUseCase', () => {
  it('returns therapy sessions from newest to oldest across dates, therapists, and session indexes', async () => {
    const repository = new InMemoryTherapyRepository();

    await repository.saveMany([
      makeSession('t-sep09-j1', '2026-09-09', 'LIC JOHANNA RAMETA', 1, 'TERAPIA OCUPACIONAL'),
      makeSession('t-sep09-j2', '2026-09-09', 'LIC JOHANNA RAMETA', 2, 'TERAPIA OCUPACIONAL'),
      makeSession('t-sep09-c1', '2026-09-09', 'TSU CATHERIN CAMARA', 1, 'FISIOTERAPIA'),
      makeSession('t-sep29-j1', '2026-09-29', 'LIC JOHANNA RAMETA', 1, 'FISIOTERAPIA'),
      makeSession('t-sep29-j2', '2026-09-29', 'LIC JOHANNA RAMETA', 2, 'FISIOTERAPIA'),
    ]);

    const useCase = new GetTherapiesUseCase(repository);
    const result = await useCase.execute();

    expect(result.map((s) => s.id)).toStrictEqual([
      't-sep29-j2',
      't-sep29-j1',
      't-sep09-c1',
      't-sep09-j2',
      't-sep09-j1',
    ]);
  });

  it('keeps reverse chronological order when filters are applied', async () => {
    const repository = new InMemoryTherapyRepository();
    await repository.saveMany([
      makeSession('t-1', '2026-09-09', 'LIC JOHANNA RAMETA', 1, 'TERAPIA OCUPACIONAL'),
      makeSession('t-2', '2026-09-11', 'TSU CATHERIN CAMARA', 1, 'FISIOTERAPIA'),
      makeSession('t-3', '2026-09-29', 'LIC JOHANNA RAMETA', 1, 'TERAPIA OCUPACIONAL'),
    ]);

    const useCase = new GetTherapiesUseCase(repository);
    const result = await useCase.execute({ specialty: 'TERAPIA OCUPACIONAL' });

    expect(result.map((s) => s.id)).toStrictEqual(['t-3', 't-1']);
  });

  it('does not mutate the repository array when reversing order', async () => {
    const first = makeSession('t-1', '2026-09-09', 'LIC JOHANNA RAMETA', 1);
    const second = makeSession('t-2', '2026-09-29', 'LIC JOHANNA RAMETA', 1);
    const backingArray = [first, second];

    const stubRepo: TherapyRepository = {
      findByImportHash: async () => null,
      findMany: async () => backingArray,
      save: async (session) => session,
      saveMany: async () => ({ inserted: 0, skipped: 0, items: [] }),
    };

    const useCase = new GetTherapiesUseCase(stubRepo);
    const result = await useCase.execute();

    expect(result.map((s) => s.id)).toStrictEqual(['t-2', 't-1']);
    expect(backingArray.map((s) => s.id)).toStrictEqual(['t-1', 't-2']);
  });

  it('returns an empty list when no therapy sessions exist', async () => {
    const repository = new InMemoryTherapyRepository();
    const useCase = new GetTherapiesUseCase(repository);

    expect(await useCase.execute()).toStrictEqual([]);
  });

  it('keeps Excel export in ascending chronological order while table read is reversed', async () => {
    const repository = new InMemoryTherapyRepository();
    await repository.saveMany([
      makeSession('t-1', '2026-09-09', 'LIC JOHANNA RAMETA', 1),
      makeSession('t-2', '2026-09-09', 'LIC JOHANNA RAMETA', 2),
      makeSession('t-3', '2026-09-29', 'LIC JOHANNA RAMETA', 1),
    ]);

    let exportedIds: string[] = [];
    const exporter: TherapyExporterPort = {
      exportToExcel: async (sessions) => {
        exportedIds = sessions.map((s) => s.id);
        return Buffer.from('mock-xlsx');
      },
    };

    const tableRows = await new GetTherapiesUseCase(repository).execute();
    await new ExportTherapiesUseCase(repository, exporter).execute(undefined, 'HISTÓRICO');

    expect(tableRows.map((s) => s.id)).toStrictEqual(['t-3', 't-2', 't-1']);
    expect(exportedIds).toStrictEqual(['t-1', 't-2', 't-3']);
  });
});
