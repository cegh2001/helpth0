import { describe, expect, it } from 'vitest';
import { InMemoryConsultationRepository } from '../../mocks/in-memory-consultation.repository';
import { InMemoryDoctorRepository } from '../../mocks/in-memory-doctor.repository';
import { InMemorySpecialtyRateRepository } from '../../mocks/in-memory-specialty-rate.repository';
import { ImportConsultationsUseCase } from '@/core/application/use-cases/consultations/import-consultations.use-case';
import { ConsultationCsvParser } from '@/infrastructure/parsers/consultation-excel.parser';
import { SpecialtyRate } from '@/core/domain/entities/specialty-rate.entity';

const SAMPLE_CSV = `
#,Fecha,Nombre y Apellido,Cedula,Direccion,Telefono,Medicos,Consulta,Punto,Pago Movil,Efectivo,Tasa BCV,Divisas,TOTAL,Observaciones
1,2026-10-01,LEONARDO BNOLIVAR,7996174,CARABALLEDA,4127109167,DRA MAILET CONTRERA,TRAUMATOLOGIA,4300.85,,,860.17,5,,COMPLETO
2,2026-10-01,CARLOS LOPEZ,20780600,CARABALLEDA,4122931279,DRA MAILET CONTRERA,TRAUMATOLOGIA,4300.85,,,860.17,5,,COMPLETO
3,2026-10-01,IRMA PEREZ,6494885,CARABALLEDA,4241292863,DRA MAILET CONTRERA,TRAUMATOLOGIA,4300.85,,,860.17,5,,COMPLETO
`;

describe('ImportConsultationsUseCase', () => {
  it('imports valid consultations on first run and skips duplicates on second run', async () => {
    const repository = new InMemoryConsultationRepository();
    const parser = new ConsultationCsvParser();
    const useCase = new ImportConsultationsUseCase(repository, parser);

    // First import
    const result1 = await useCase.execute({ csvContent: SAMPLE_CSV });
    expect(result1.totalInFile).toBe(3);
    expect(result1.inserted).toBe(3);
    expect(result1.skippedDuplicates).toBe(0);

    // Second import of the identical file
    const result2 = await useCase.execute({ csvContent: SAMPLE_CSV });
    expect(result2.totalInFile).toBe(3);
    expect(result2.inserted).toBe(0);
    expect(result2.skippedDuplicates).toBe(3);

    // Verify stored items
    const all = await repository.findMany();
    expect(all.length).toBe(3);
  });

  it('automatically creates doctors in doctorRepository and links consultations when doctorRepository is provided', async () => {
    const repository = new InMemoryConsultationRepository();
    const doctorRepo = new InMemoryDoctorRepository();
    const parser = new ConsultationCsvParser();
    const useCase = new ImportConsultationsUseCase(repository, parser, doctorRepo);

    const result = await useCase.execute({ csvContent: SAMPLE_CSV });
    expect(result.inserted).toBe(3);

    const doctors = await doctorRepo.findAll();
    expect(doctors.length).toBe(1);
    expect(doctors[0].name).toBe('DRA MAILET CONTRERA');
    expect(doctors[0].specialty).toBe('TRAUMATOLOGIA');
    expect(doctors[0].isActive).toBe(true);

    const consultations = await repository.findMany();
    expect(consultations[0].doctorId).toBe(doctors[0].id);
    expect(consultations[1].doctorId).toBe(doctors[0].id);
    expect(consultations[2].doctorId).toBe(doctors[0].id);
  });

  it('sanitizes input consultations and applies payment calculation rules', async () => {
    const repository = new InMemoryConsultationRepository();
    const doctorRepo = new InMemoryDoctorRepository();
    const parser = new ConsultationCsvParser();
    const useCase = new ImportConsultationsUseCase(repository, parser, doctorRepo);

    const inputData = [
      {
        date: '2026-10-01T00:00:00.000Z', // ISO string
        patientName: '  PACIENTE BS ONLY  ',
        doctorName: 'DRA MAILET CONTRERA',
        specialty: 'TRAUMATOLOGIA',
        amountPointBs: 4300.85,
        amountMobileBs: 0,
        amountCashBs: 0,
        bcvRate: 860.17,
        amountUsd: 0, // Should be calculated as 4300.85 / 860.17 = 5
        totalBs: 0,
      },
      {
        date: '2026-10-02',
        patientName: 'PACIENTE USD ONLY',
        doctorName: 'DRA MAILET CONTRERA',
        specialty: 'TRAUMATOLOGIA',
        amountPointBs: 0,
        amountMobileBs: 0,
        amountCashBs: 0,
        bcvRate: 860.17,
        amountUsd: 15,
        totalBs: 0, // Should be calculated as 15 * 860.17 = 12902.55
        exonerationPercent: 100,
      },
    ];

    const result = await useCase.execute({ consultations: inputData as never });
    expect(result.inserted).toBe(2);

    const saved = await repository.findMany();
    expect(saved.length).toBe(2);

    // Row 1: Bs only -> derives USD
    expect(saved[0].patientName).toBe('PACIENTE BS ONLY');
    expect(saved[0].date).toBe('2026-10-01');
    expect(saved[0].amountUsd).toBe(5);
    expect(saved[0].totalBs).toBe(4300.85);

    // Row 2: USD only -> derives total Bs
    expect(saved[1].patientName).toBe('PACIENTE USD ONLY');
    expect(saved[1].totalBs).toBe(12902.55);
    expect(saved[1].amountUsd).toBe(15);
    expect(saved[1].exonerationPercent).toBe(100);
    expect(saved[1].exoneratedAmountUsd).toBe(15);
    expect(saved[1].status).toBe('EXONERADO 100%');
  });

  it('applies configured specialty rate ($15 for Psicologia, $10 default for others) when exonerated consultation lacks amountUsd', async () => {
    const repository = new InMemoryConsultationRepository();
    const rateRepo = new InMemorySpecialtyRateRepository();
    const parser = new ConsultationCsvParser();
    const useCase = new ImportConsultationsUseCase(repository, parser, undefined, rateRepo);

    rateRepo.seed([
      SpecialtyRate.create({
        specialty: 'Psicologia',
        standardRateUsd: 15,
      }),
    ]);

    const inputData = [
      {
        date: '2026-10-01',
        patientName: 'PACIENTE PSICOLOGIA EXONERADO',
        doctorName: 'LIC MARIA DE SOUSA',
        specialty: 'Psicologia',
        bcvRate: 860,
        amountPointBs: 0,
        amountMobileBs: 0,
        amountCashBs: 0,
        amountUsd: 0,
        exonerationPercent: 100,
      },
      {
        date: '2026-10-01',
        patientName: 'PACIENTE TRAUMATOLOGIA EXONERADO',
        doctorName: 'DRA MAILET CONTRERA',
        specialty: 'Traumatologia',
        bcvRate: 860,
        amountPointBs: 0,
        amountMobileBs: 0,
        amountCashBs: 0,
        amountUsd: 0,
        exonerationPercent: 100,
      },
      {
        date: '2026-10-01',
        patientName: 'PACIENTE CON MONTO EXPLICITO',
        doctorName: 'DR GREGORY HOUSE',
        specialty: 'Psicologia',
        bcvRate: 860,
        amountPointBs: 0,
        amountMobileBs: 0,
        amountCashBs: 0,
        amountUsd: 25,
        exonerationPercent: 100,
      },
    ];

    await useCase.execute({ consultations: inputData as never });

    const saved = await repository.findMany();
    expect(saved.length).toBe(3);

    // 1. Psicologia -> matched in repo -> $15
    expect(saved[0].specialty).toBe('Psicologia');
    expect(saved[0].amountUsd).toBe(15);
    expect(saved[0].exoneratedAmountUsd).toBe(15);
    expect(saved[0].totalBs).toBe(12900); // 15 * 860

    // 2. Traumatologia -> not in repo -> default $10
    expect(saved[1].specialty).toBe('Traumatologia');
    expect(saved[1].amountUsd).toBe(10);
    expect(saved[1].exoneratedAmountUsd).toBe(10);
    expect(saved[1].totalBs).toBe(8600); // 10 * 860

    // 3. Explicit amount in input -> preserves $25
    expect(saved[2].amountUsd).toBe(25);
    expect(saved[2].exoneratedAmountUsd).toBe(25);
    expect(saved[2].totalBs).toBe(21500); // 25 * 860
  });
});
