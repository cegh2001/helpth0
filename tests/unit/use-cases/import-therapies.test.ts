import { describe, expect, it } from 'vitest';
import { InMemoryTherapyRepository } from '../../mocks/in-memory-therapy.repository';
import { ImportTherapiesUseCase } from '@/core/application/use-cases/therapies/import-therapies.use-case';
import { TherapyExcelParser } from '@/infrastructure/parsers/therapy-excel.parser';

const SAMPLE_CSV = `#,Fecha,Terapeuta,Especialidad,Dia,Punto,Pago Movil,Efectivo,Tasa BCV,Divisas,TOTAL,Observaciones
1,2026-09-09,LIC JOHANNA RAMETA,TERAPIA OCUPACIONAL,MIERCOLES,,,,820.1,15,,COMPLETO
2,2026-09-09,LIC JOHANNA RAMETA,TERAPIA OCUPACIONAL,MIERCOLES,,,,820.1,15,,COMPLETO
1,2026-09-11,TSU CATHERIN CAMARA,FISIOTERAPEUTA,VIERNES,,,,832.49,15,,COMPLETO
`;

describe('ImportTherapiesUseCase', () => {
  it('imports a batch once and skips the whole batch on re-import', async () => {
    const repository = new InMemoryTherapyRepository();
    const useCase = new ImportTherapiesUseCase(repository, new TherapyExcelParser());

    const first = await useCase.execute({ csvContent: SAMPLE_CSV });
    const second = await useCase.execute({ csvContent: SAMPLE_CSV });

    expect(first.inserted).toBe(3);
    expect(first.skippedDuplicates).toBe(0);
    expect(second.inserted).toBe(0);
    expect(second.skippedDuplicates).toBe(3);

    const stored = await repository.findMany();
    expect(stored.length).toBe(3);
  });

  it('keeps the session amount in dollars and resolves the billed Bs total', async () => {
    const repository = new InMemoryTherapyRepository();
    const useCase = new ImportTherapiesUseCase(repository, new TherapyExcelParser());

    const result = await useCase.execute({ csvContent: SAMPLE_CSV });
    const [stored] = await repository.findMany({ date: '2026-09-09' });

    expect(result.summary.totalAmountUsd).toBe(45);
    expect(result.summary.totalAmountBs).toBe(37090.35);
    expect(stored.totalBs).toBe(12301.5);
    expect(stored.status).toBe('COMPLETO');
  });

  it('treats a 100% exonerated session as billed but not collected', async () => {
    const repository = new InMemoryTherapyRepository();
    const useCase = new ImportTherapiesUseCase(repository, new TherapyExcelParser());
    const csv = `#,Fecha,Terapeuta,Especialidad,Dia,Punto,Pago Movil,Efectivo,Tasa BCV,Divisas,TOTAL,Observaciones
1,2026-09-09,LIC JOHANNA RAMETA,TERAPIA OCUPACIONAL,MIERCOLES,,,,820.1,15,,EXONERADO`;

    const result = await useCase.execute({ csvContent: csv });
    const [stored] = await repository.findMany();

    expect(stored.totalBs).toBe(12301.5);
    expect(stored.exonerationPercent).toBe(100);
    expect(stored.exoneratedAmountUsd).toBe(15);
    expect(result.summary.totalExoneratedUsd).toBe(15);
  });

  it('recomputes identity when a reviewed therapist name is corrected', async () => {
    const repository = new InMemoryTherapyRepository();
    const useCase = new ImportTherapiesUseCase(repository, new TherapyExcelParser());
    const base = {
      date: '2026-09-09',
      specialty: 'TERAPIA OCUPACIONAL',
      sessionIndex: 1,
      bcvRate: 820.1,
      amountUsd: 15,
      totalBs: 0,
      status: 'COMPLETO',
      exonerationPercent: 0,
      exoneratedAmountUsd: 0,
      observations: 'COMPLETO',
      isDuplicate: false,
    };

    await useCase.execute({
      therapies: [
        { ...base, therapistName: 'LIC JOHANA RAMETA' },
        { ...base, therapistName: 'LIC JOHANNA RAMETA' },
      ],
    });

    const stored = await repository.findMany();
    expect(stored.length).toBe(2);
    expect(stored.map((session) => session.therapistName).sort()).toEqual([
      'LIC JOHANA RAMETA',
      'LIC JOHANNA RAMETA',
    ]);
  });

  it('rejects a batch without valid sessions and persists nothing', async () => {
    const repository = new InMemoryTherapyRepository();
    const useCase = new ImportTherapiesUseCase(repository, new TherapyExcelParser());

    await expect(
      useCase.execute({
        therapies: [
          {
            date: '2026-09-09',
            therapistName: '   ',
            specialty: 'TERAPIA OCUPACIONAL',
            sessionIndex: 1,
            amountUsd: 15,
          },
        ],
      })
    ).rejects.toThrow('No se encontraron terapias válidas para importar');

    expect((await repository.findMany()).length).toBe(0);
  });
});
