import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
  parseConsultationsFromCsv,
  parseConsultationsFromBuffer,
} from '@/infrastructure/parsers/consultation-excel.parser';

const SAMPLE_CSV = `
#,Fecha,Nombre y Apellido,Cedula,Direccion,Telefono,Medicos,Consulta,Punto,Pago Movil,Efectivo,Tasa BCV,Divisas,TOTAL,Observaciones
1,2026-10-01,LEONARDO BNOLIVAR,7996174,CARABALLEDA,4127109167,DRA MAILET CONTRERA,TRAUMATOLOGIA,4300.85,,,860.17,5,,COMPLETO
2,2026-10-01,CARLOS LOPEZ,20780600,CARABALLEDA,4122931279,DRA MAILET CONTRERA,TRAUMATOLOGIA,4300.85,,,860.17,5,,COMPLETO
3,2026-10-01,IRMA PEREZ,6494885,CARABALLEDA,4241292863,DRA MAILET CONTRERA,TRAUMATOLOGIA,4300.85,,,860.17,5,,COMPLETO
,,,,,,,,,,,,,,
1,2026-10-01,MARIA DESOUSA,5963322,CARABALLEDA,4242935993,DRA NEYDA CASTILLO,MEDICINA INTERNA,4300.85,,,860.17,5,,COMPLETO
2,2026-10-01,SIMON LOPEZ,4561810,CARABALLEDA,4125999541,LIC MARIA JOSE DE SOUSA,PSICOLOGIA,12902.55,,,860.17,15,,EXONERADO
,,,,,,,,,,,,,,
1,2026-10-13,LIAM PEREZ,,CARABALLEDA,4143227345,DR GILBERTO BRACHO,PEDIATRIA,,4383.95,,876.79,5,,COMPLETO
,,,,,
,RESUMEN CONSOLIDADO DE CONSULTAS Y PACIENTES - OCTUBRE 2026,,,,
,,,,,
,Especialidad,Total Pacientes,Tarifa Ref. ($),Total Facturado (Bs),% Pacientes
,TRAUMATOLOGIA,,5,,
,MEDICINA GENERAL,,5,,
,TOTAL GENERAL,,,,
,,,,,
,DISTRIBUCIÓN SEMANAL DETALLADA,,,,
,Semana,Especialidad,Pacientes,Total Facturado (Bs),
,Semana 1 (01/10 al 02/10),TRAUMATOLOGIA,,,
`;

describe('Consultation Excel/CSV Parser', () => {
  it('parses valid operational rows and ignores summary sections and empty lines', () => {
    const result = parseConsultationsFromCsv(SAMPLE_CSV);

    expect(result.consultations.length).toBe(6);
    expect(result.errors.length).toBe(0);

    const first = result.consultations[0];
    expect(first.date).toBe('2026-10-01');
    expect(first.patientName).toBe('LEONARDO BNOLIVAR');
    expect(first.patientCedula).toBe('7996174');
    expect(first.doctorName).toBe('DRA MAILET CONTRERA');
    expect(first.specialty).toBe('TRAUMATOLOGIA');
    expect(first.amountPointBs).toBe(4300.85);
    expect(first.amountUsd).toBe(5);
    expect(first.status).toBe('COMPLETO');

    const pediatric = result.consultations[5];
    expect(pediatric.patientName).toBe('LIAM PEREZ');
    expect(pediatric.patientCedula).toBeNull();
    expect(pediatric.doctorName).toBe('DR GILBERTO BRACHO');
    expect(pediatric.specialty).toBe('PEDIATRIA');
    expect(pediatric.amountMobileBs).toBe(4383.95);
  });

  it('correctly populates summary statistics', () => {
    const result = parseConsultationsFromCsv(SAMPLE_CSV);

    expect(result.summary.totalParsed).toBe(6);
    expect(result.summary.uniqueDoctors.length).toBe(4);
    expect(result.summary.uniqueSpecialties).toContain('TRAUMATOLOGIA');
    expect(result.summary.uniqueSpecialties).toContain('PSICOLOGIA');
    expect(result.summary.totalAmountUsd).toBe(40);
    expect(result.summary.totalExoneratedUsd).toBe(15);
    expect(result.summary.exoneratedPatientsCount).toBe(1);
    expect(result.summary.minBcvRate).toBe(860.17);
  });

  it('parses valid consultations from an Excel buffer', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Control de Pago');
    sheet.addRow([
      '#',
      'Fecha',
      'Nombre y Apellido',
      'Cedula',
      'Direccion',
      'Telefono',
      'Medicos',
      'Consulta',
      'Punto',
      'Pago Movil',
      'Efectivo',
      'Tasa BCV',
      'Divisas',
      'TOTAL',
      'Observaciones',
    ]);
    sheet.addRow([
      1,
      new Date('2026-10-01T00:00:00.000Z'),
      'JUAN PEREZ',
      '12345678',
      'CARABALLEDA',
      '4121234567',
      'DRA MAILET CONTRERA',
      'TRAUMATOLOGIA',
      4300.85,
      null,
      null,
      860.17,
      5,
      4300.85,
      'COMPLETO',
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    const result = await parseConsultationsFromBuffer(Buffer.from(buffer));

    expect(result.consultations.length).toBe(1);
    expect(result.consultations[0].patientName).toBe('JUAN PEREZ');
    expect(result.consultations[0].patientCedula).toBe('12345678');
    expect(result.consultations[0].amountUsd).toBe(5);
    expect(result.summary.totalParsed).toBe(1);
  });
});
