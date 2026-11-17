import { describe, expect, it } from 'vitest';
import { InMemoryConsultationRepository } from '../../mocks/in-memory-consultation.repository';
import { Consultation } from '@/core/domain/entities/consultation.entity';
import { GetConsultationsUseCase } from '@/core/application/use-cases/consultations/get-consultations.use-case';
import { ExportConsultationsUseCase } from '@/core/application/use-cases/consultations/export-consultations.use-case';
import { ConsultationExporterPort } from '@/core/application/ports/consultation-exporter.port';
import { ConsultationRepository } from '@/core/domain/repositories/consultation.repository';

function makeConsultation(
  id: string,
  date: string,
  patientName: string,
  createdAt: Date,
  specialty = 'Traumatología'
): Consultation {
  return Consultation.create({
    id,
    date,
    patientName,
    doctorName: 'Dra. Mailet Contrera',
    specialty,
    amountUsd: 5,
    totalBs: 4300,
    bcvRate: 860,
    createdAt,
  });
}

describe('GetConsultationsUseCase', () => {
  it('returns consultations from newest to oldest across dates and within the same day', async () => {
    const repository = new InMemoryConsultationRepository();
    const sameBatchTime = new Date('2026-10-02T10:00:00.000Z');

    await repository.saveMany([
      makeConsultation('c-oct1-late', '2026-10-01', 'Paciente Oct 1 Tarde', new Date('2026-10-01T15:00:00.000Z')),
      makeConsultation('c-oct1-early', '2026-10-01', 'Paciente Oct 1 Mañana', new Date('2026-10-01T08:00:00.000Z')),
      makeConsultation('c-oct2-row1', '2026-10-02', 'Paciente Oct 2 Fila 1', sameBatchTime),
      makeConsultation('c-oct2-row2', '2026-10-02', 'Paciente Oct 2 Fila 2', sameBatchTime),
      makeConsultation('c-nov17', '2026-11-17', 'Paciente Nov 17', new Date('2026-11-17T09:00:00.000Z')),
    ]);

    const useCase = new GetConsultationsUseCase(repository);
    const result = await useCase.execute();

    expect(result.map((c) => c.id)).toStrictEqual([
      'c-nov17',
      'c-oct2-row2',
      'c-oct2-row1',
      'c-oct1-late',
      'c-oct1-early',
    ]);
  });

  it('keeps reverse chronological order when filters are applied', async () => {
    const repository = new InMemoryConsultationRepository();
    await repository.saveMany([
      makeConsultation('c-1', '2026-10-01', 'Ana', new Date('2026-10-01T08:00:00.000Z'), 'Pediatría'),
      makeConsultation('c-2', '2026-10-05', 'Luis', new Date('2026-10-05T08:00:00.000Z'), 'Traumatología'),
      makeConsultation('c-3', '2026-10-10', 'María', new Date('2026-10-10T08:00:00.000Z'), 'Pediatría'),
    ]);

    const useCase = new GetConsultationsUseCase(repository);
    const result = await useCase.execute({ specialty: 'Pediatría' });

    expect(result.map((c) => c.id)).toStrictEqual(['c-3', 'c-1']);
  });

  it('does not mutate the repository array when reversing order', async () => {
    const first = makeConsultation('c-1', '2026-10-01', 'Ana', new Date('2026-10-01T08:00:00.000Z'));
    const second = makeConsultation('c-2', '2026-10-02', 'Luis', new Date('2026-10-02T08:00:00.000Z'));
    const backingArray = [first, second];

    const stubRepo: ConsultationRepository = {
      findByImportHash: async () => null,
      findMany: async () => backingArray,
      save: async (c) => c,
      saveMany: async () => ({ inserted: 0, skipped: 0, items: [] }),
    };

    const useCase = new GetConsultationsUseCase(stubRepo);
    const result = await useCase.execute();

    expect(result.map((c) => c.id)).toStrictEqual(['c-2', 'c-1']);
    expect(backingArray.map((c) => c.id)).toStrictEqual(['c-1', 'c-2']);
  });

  it('returns an empty list when no consultations exist', async () => {
    const repository = new InMemoryConsultationRepository();
    const useCase = new GetConsultationsUseCase(repository);

    expect(await useCase.execute()).toStrictEqual([]);
  });

  it('keeps Excel export in ascending chronological order while table read is reversed', async () => {
    const repository = new InMemoryConsultationRepository();
    await repository.saveMany([
      makeConsultation('c-1', '2026-10-01', 'Primero', new Date('2026-10-01T08:00:00.000Z')),
      makeConsultation('c-2', '2026-10-15', 'Segundo', new Date('2026-10-15T08:00:00.000Z')),
      makeConsultation('c-3', '2026-11-17', 'Último', new Date('2026-11-17T08:00:00.000Z')),
    ]);

    let exportedIds: string[] = [];
    const exporter: ConsultationExporterPort = {
      exportToExcel: async (consultations) => {
        exportedIds = consultations.map((c) => c.id);
        return Buffer.from('mock-xlsx');
      },
    };

    const tableRows = await new GetConsultationsUseCase(repository).execute();
    await new ExportConsultationsUseCase(repository, exporter).execute(undefined, 'HISTÓRICO');

    expect(tableRows.map((c) => c.id)).toStrictEqual(['c-3', 'c-2', 'c-1']);
    expect(exportedIds).toStrictEqual(['c-1', 'c-2', 'c-3']);
  });
});
