import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
  parseMedicalExamsFromCsv,
  parseMedicalExamsFromBuffer,
} from '@/infrastructure/parsers/medical-exam-excel.parser';

const SAMPLE_CSV = `
#,Fecha,Nombre y Apellido,Cedula,Fecha de Nacimiento,Telefono,Direccion,Examenes,Punto,Pago Movil,Efectivo,Tasa BCV,Divisas,TOTAL,OBSERVACIONES
1,2026-09-28,ZORAIDA FERNANDEZ,11639560,1973-03-28,4149211060,CARABALLEDA,,37067.41,,,857.05,86.5,,EXONERADO 50%
,,,,,,,,,,,,,,
1,2026-09-29,YOENNIFER HERNANDEZ,33262145,2010-04-24,4126284702,CARABALLEDA,,,53188.56,,857.88,62,,COMPLETO
,,,,,,,,,,,,,,
1,2026-09-30,JHON GARCIA,13280019,2010-01-29,4142822428,CARABALLEDA,,12885.9,,,859.06,15,,COMPLETO
2,2026-09-30,JACOBO RADA,2429558,1946-11-28,4127693144,CARABALLEDA,,,12885.9,,859.06,15,,COMPLETO
,,,,,,,,,,,,,,
1,2026-10-14,NELSON TORRES,6290202,1969-04-21,4120915213,CARABALLEDA,,0,,,877.9,0,,REPETICION
,,,,,,,,,,,,,,
1,2026-10-19,HEIDI PEREZ,13043468,1978-03-19,4242097399,CARABALLEDA,"4.405,30",1321.5,4405.3,,881.06,13,,EXONERADO 50%
,,,,,,,
,RESUMEN CONSOLIDADO DE EXÁMENES Y LABORATORIO - SEPT/OCT 2026,,,,,,
,Semana,Pacientes Atendidos,Total Divisas ($),Cobrado Punto (Bs),Cobrado Pago Móvil (Bs),Cobrado Efectivo (Bs),Total Facturado (Bs)
,Semana 1 (28/09 al 02/10),,,,,,
,TOTAL GENERAL,,,,,,
,CLASIFICACIÓN POR ESTATUS Y CONDICIÓN DE PAGO,,,,,,
,Condición / Observación,Cantidad de Pacientes,Monto en Divisas ($),Total Equivalente (Bs),% de Casos,,
,COMPLETO,,,,,,
,TOTAL PACIENTES,,,,,,
`;

describe('Medical Exam Excel/CSV Parser', () => {
  it('parses valid operational rows and ignores summary sections and empty lines', () => {
    const result = parseMedicalExamsFromCsv(SAMPLE_CSV);

    expect(result.exams.length).toBe(6);
    expect(result.errors.length).toBe(0);

    const first = result.exams[0];
    expect(first.date).toBe('2026-09-28');
    expect(first.patientName).toBe('ZORAIDA FERNANDEZ');
    expect(first.patientCedula).toBe('11639560');
    expect(first.patientBirthDate).toBe('1973-03-28');
    expect(first.patientPhone).toBe('4149211060');
    expect(first.patientAddress).toBe('CARABALLEDA');
    expect(first.examName).toBeNull();
    expect(first.amountPointBs).toBe(37067.41);
    expect(first.amountUsd).toBe(43.25);
    expect(first.exoneratedAmountUsd).toBe(43.25);
    expect(first.exonerationPercent).toBe(50);
    expect(first.status).toBe('EXONERADO 50%');

    const repeticion = result.exams[4];
    expect(repeticion.patientName).toBe('NELSON TORRES');
    expect(repeticion.status).toBe('REPETICION');

    const quoted = result.exams[5];
    expect(quoted.patientName).toBe('HEIDI PEREZ');
    expect(quoted.amountPointBs).toBe(1321.5);
    expect(quoted.amountMobileBs).toBe(4405.3);
    expect(quoted.status).toBe('EXONERADO 50%');
  });

  it('correctly calculates summary statistics', () => {
    const result = parseMedicalExamsFromCsv(SAMPLE_CSV);

    expect(result.summary.totalParsed).toBe(6);
    expect(result.summary.exoneratedPatientsCount).toBe(2);
    expect(result.summary.minBcvRate).toBe(857.05);
    expect(result.summary.maxBcvRate).toBe(881.06);
    expect(result.summary.dateRange).toEqual({ min: '2026-09-28', max: '2026-10-19' });
  });

  it('parses valid exams from an Excel buffer', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Control de Exámenes');
    sheet.addRow([
      '#',
      'Fecha',
      'Nombre y Apellido',
      'Cedula',
      'Fecha de Nacimiento',
      'Telefono',
      'Direccion',
      'Examenes',
      'Punto',
      'Pago Movil',
      'Efectivo',
      'Tasa BCV',
      'Divisas',
      'TOTAL',
      'OBSERVACIONES',
    ]);
    sheet.addRow([
      1,
      new Date('2026-09-28T00:00:00.000Z'),
      'ZORAIDA FERNANDEZ',
      '11639560',
      '1973-03-28',
      '4149211060',
      'CARABALLEDA',
      null,
      37067.41,
      null,
      null,
      857.05,
      86.5,
      null,
      'EXONERADO 50%',
    ]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const result = await parseMedicalExamsFromBuffer(buffer);

    expect(result.exams.length).toBe(1);
    expect(result.exams[0].patientName).toBe('ZORAIDA FERNANDEZ');
    expect(result.exams[0].date).toBe('2026-09-28');
    expect(result.exams[0].amountPointBs).toBe(37067.41);
  });
});
