import { describe, expect, it } from 'vitest';
import { InMemoryConsultationRepository } from '../../mocks/in-memory-consultation.repository';
import { InMemoryDoctorRepository } from '../../mocks/in-memory-doctor.repository';
import { ImportConsultationsUseCase } from '@/core/application/use-cases/consultations/import-consultations.use-case';
import { ConsultationCsvParser } from '@/infrastructure/parsers/consultation-excel.parser';

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
});
