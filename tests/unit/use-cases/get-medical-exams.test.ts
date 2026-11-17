import { describe, expect, it } from 'vitest';
import { InMemoryMedicalExamRepository } from '../../mocks/in-memory-medical-exam.repository';
import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';
import { GetMedicalExamsUseCase } from '@/core/application/use-cases/exams/get-medical-exams.use-case';
import { ExportMedicalExamsUseCase } from '@/core/application/use-cases/exams/export-medical-exams.use-case';
import { MedicalExamExporterPort } from '@/core/application/ports/medical-exam-exporter.port';
import { MedicalExamRepository } from '@/core/domain/repositories/medical-exam.repository';

function makeExam(
  id: string,
  date: string,
  patientName: string,
  createdAt: Date,
  examName = 'Hematología'
): MedicalExam {
  return MedicalExam.create({
    id,
    date,
    patientName,
    examName,
    amountUsd: 15,
    totalBs: 12900,
    bcvRate: 860,
    createdAt,
  });
}

describe('GetMedicalExamsUseCase', () => {
  it('returns medical exams from newest to oldest across dates and within the same day', async () => {
    const repository = new InMemoryMedicalExamRepository();
    const sameBatchTime = new Date('2026-09-30T10:00:00.000Z');

    await repository.saveMany([
      makeExam('e-sep28-late', '2026-09-28', 'Paciente Sep 28 Tarde', new Date('2026-09-28T16:00:00.000Z')),
      makeExam('e-sep28-early', '2026-09-28', 'Paciente Sep 28 Mañana', new Date('2026-09-28T08:00:00.000Z')),
      makeExam('e-sep30-row1', '2026-09-30', 'Paciente Sep 30 Fila 1', sameBatchTime),
      makeExam('e-sep30-row2', '2026-09-30', 'Paciente Sep 30 Fila 2', sameBatchTime),
      makeExam('e-nov17', '2026-11-17', 'Paciente Nov 17', new Date('2026-11-17T09:00:00.000Z')),
    ]);

    const useCase = new GetMedicalExamsUseCase(repository);
    const result = await useCase.execute();

    expect(result.map((e) => e.id)).toStrictEqual([
      'e-nov17',
      'e-sep30-row2',
      'e-sep30-row1',
      'e-sep28-late',
      'e-sep28-early',
    ]);
  });

  it('keeps reverse chronological order when filters are applied', async () => {
    const repository = new InMemoryMedicalExamRepository();
    await repository.saveMany([
      makeExam('e-1', '2026-09-28', 'Zoraida', new Date('2026-09-28T08:00:00.000Z'), 'Perfil 20'),
      makeExam('e-2', '2026-09-29', 'Carlos', new Date('2026-09-29T08:00:00.000Z'), 'Glicemia'),
      makeExam('e-3', '2026-10-14', 'Nelson', new Date('2026-10-14T08:00:00.000Z'), 'Perfil 20'),
    ]);

    const useCase = new GetMedicalExamsUseCase(repository);
    const result = await useCase.execute({ searchQuery: 'Perfil 20' });

    expect(result.map((e) => e.id)).toStrictEqual(['e-3', 'e-1']);
  });

  it('does not mutate the repository array when reversing order', async () => {
    const first = makeExam('e-1', '2026-09-28', 'Zoraida', new Date('2026-09-28T08:00:00.000Z'));
    const second = makeExam('e-2', '2026-09-29', 'Carlos', new Date('2026-09-29T08:00:00.000Z'));
    const backingArray = [first, second];

    const stubRepo: MedicalExamRepository = {
      findByImportHash: async () => null,
      findMany: async () => backingArray,
      save: async (exam) => exam,
      saveMany: async () => ({ inserted: 0, skipped: 0, items: [] }),
    };

    const useCase = new GetMedicalExamsUseCase(stubRepo);
    const result = await useCase.execute();

    expect(result.map((e) => e.id)).toStrictEqual(['e-2', 'e-1']);
    expect(backingArray.map((e) => e.id)).toStrictEqual(['e-1', 'e-2']);
  });

  it('returns an empty list when no medical exams exist', async () => {
    const repository = new InMemoryMedicalExamRepository();
    const useCase = new GetMedicalExamsUseCase(repository);

    expect(await useCase.execute()).toStrictEqual([]);
  });

  it('keeps Excel export in ascending chronological order while table read is reversed', async () => {
    const repository = new InMemoryMedicalExamRepository();
    await repository.saveMany([
      makeExam('e-1', '2026-09-28', 'Primero', new Date('2026-09-28T08:00:00.000Z')),
      makeExam('e-2', '2026-10-14', 'Segundo', new Date('2026-10-14T08:00:00.000Z')),
      makeExam('e-3', '2026-11-17', 'Último', new Date('2026-11-17T08:00:00.000Z')),
    ]);

    let exportedIds: string[] = [];
    const exporter: MedicalExamExporterPort = {
      exportToExcel: async (exams) => {
        exportedIds = exams.map((e) => e.id);
        return Buffer.from('mock-xlsx');
      },
    };

    const tableRows = await new GetMedicalExamsUseCase(repository).execute();
    await new ExportMedicalExamsUseCase(repository, exporter).execute(undefined, 'HISTÓRICO');

    expect(tableRows.map((e) => e.id)).toStrictEqual(['e-3', 'e-2', 'e-1']);
    expect(exportedIds).toStrictEqual(['e-1', 'e-2', 'e-3']);
  });
});
