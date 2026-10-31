import { describe, expect, it } from 'vitest';
import { InMemoryMedicalExamRepository } from '../../mocks/in-memory-medical-exam.repository';
import { ImportMedicalExamsUseCase } from '@/core/application/use-cases/exams/import-medical-exams.use-case';
import { MedicalExamExcelParser } from '@/infrastructure/parsers/medical-exam-excel.parser';

const SAMPLE_CSV = `
#,Fecha,Nombre y Apellido,Cedula,Fecha de Nacimiento,Telefono,Direccion,Examenes,Punto,Pago Movil,Efectivo,Tasa BCV,Divisas,TOTAL,OBSERVACIONES
1,2026-09-28,ZORAIDA FERNANDEZ,11639560,1973-03-28,4149211060,CARABALLEDA,,37067.41,,,857.05,86.5,,EXONERADO 50%
1,2026-09-29,YOENNIFER HERNANDEZ,33262145,2010-04-24,4126284702,CARABALLEDA,,,53188.56,,857.88,62,,COMPLETO
1,2026-09-30,JHON GARCIA,13280019,2010-01-29,4142822428,CARABALLEDA,,12885.9,,,859.06,15,,COMPLETO
`;

describe('ImportMedicalExamsUseCase', () => {
  it('imports valid exams on first run and skips duplicates on second run', async () => {
    const repository = new InMemoryMedicalExamRepository();
    const parser = new MedicalExamExcelParser();
    const useCase = new ImportMedicalExamsUseCase(repository, parser);

    const result1 = await useCase.execute({ csvContent: SAMPLE_CSV });
    expect(result1.totalInFile).toBe(3);
    expect(result1.inserted).toBe(3);
    expect(result1.skippedDuplicates).toBe(0);

    const result2 = await useCase.execute({ csvContent: SAMPLE_CSV });
    expect(result2.totalInFile).toBe(3);
    expect(result2.inserted).toBe(0);
    expect(result2.skippedDuplicates).toBe(3);

    const all = await repository.findMany();
    expect(all.length).toBe(3);
  });

  it('imports preview payload and normalizes payment numbers', async () => {
    const repository = new InMemoryMedicalExamRepository();
    const parser = new MedicalExamExcelParser();
    const useCase = new ImportMedicalExamsUseCase(repository, parser);

    const result = await useCase.execute({
      exams: [
        {
          date: '2026-10-01',
          patientName: 'Virginia Cruz',
          patientCedula: '6487711',
          patientBirthDate: '1961-01-11',
          patientPhone: '',
          patientAddress: 'Caraballeda',
          examName: null,
          amountPointBs: 12902.55,
          amountMobileBs: 0,
          amountCashBs: 0,
          bcvRate: 860.17,
          amountUsd: 15,
          totalBs: 12902.55,
          status: 'COMPLETO',
          exonerationPercent: 0,
          exoneratedAmountUsd: 0,
          observations: 'COMPLETO',
        },
      ],
    });

    expect(result.inserted).toBe(1);
    expect(result.skippedDuplicates).toBe(0);

    const stored = await repository.findMany();
    expect(stored.length).toBe(1);
    expect(stored[0].patientName).toBe('Virginia Cruz');
    expect(stored[0].patientCedula).toBe('6487711');
    expect(stored[0].totalBs).toBe(12902.55);
  });
});
