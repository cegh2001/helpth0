import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
  parseTherapiesFromBuffer,
  parseTherapiesFromCsv,
} from '@/infrastructure/parsers/therapy-excel.parser';

const SAMPLE_CSV = `#,Fecha,Terapeuta,Especialidad,Dia,Punto,Pago Movil,Efectivo,Tasa BCV,Divisas,TOTAL,Observaciones
1,2026-09-09,LIC JOHANNA RAMETA,TERAPIA OCUPACIONAL,MIERCOLES,,,,820.1,15,,COMIENZO EL DIA MIERCOLES
2,2026-09-09,LIC JOHANNA RAMETA,TERAPIA OCUPACIONAL,MIERCOLES,,,,820.1,15,,COMIENZO EL DIA MIERCOLES
3,2026-09-09,LIC JOHANNA RAMETA,TERAPIA OCUPACIONAL,MIERCOLES,,,,820.1,15,,COMIENZO EL DIA MIERCOLES
,,,,,,,,,,,
1,2026-09-09,TSU CATHERIN CAMARA,FISIOTERAPEUTA,MARTES,,,,820.1,15,,COMPLETO
2,2026-09-09,TSU CATHERIN CAMARA,FISIOTERAPEUTA,MARTES,,,,820.1,15,,COMPLETO
,,,,,,,,,,,
1,2026-09-29,LIC JOHANNA RAMETA,FISIOTERAPEUTA,MARTES,,,,857.89,15,,COMPLETO
2,2026-09-29,LIC JOHANNA RAMETA,FISIOTERAPEUTA,MARTES,,,,857.89,15,,COMPLETO
3,2026-09-29,LIC JOHANNA RAMETA,FISIOTERAPEUTA,MARTES,,,,857.89,15,,COMPLETO
4,2026-09-29,LIC JOHANNA RAMETA,TERAPIA OCUPACIONAL,MARTES,,,,857.89,15,,COMPLETO
5,2026-09-29,LIC JOHANNA RAMETA,TERAPIA OCUPACIONAL,MARTES,,,,857.89,15,,COMPLETO
,,,,,,,,,,,
,RESUMEN CONSOLIDADO DE TERAPIAS - SEPTIEMBRE 2026,,,,,,,,,,
,Especialidad,Pacientes / Sesiones,Tarifa Ref. ($),Total Facturado (Bs),% Participación,,,,
,FISIOTERAPEUTA,19,15,219866.34,0.61,,,,`;

describe('Therapy Excel/CSV parser', () => {
  it('reads sessions that only report a dollar amount and derives the Bs total', () => {
    const result = parseTherapiesFromCsv(SAMPLE_CSV);

    expect(result.errors).toEqual([]);
    expect(result.sessions.length).toBe(10);
    expect(result.sessions[0].totalBs).toBe(12301.5);
    expect(result.sessions[0].amountUsd).toBe(15);
    expect(result.sessions[0].bcvRate).toBe(820.1);
  });

  it('keeps the workbook session index so repeated rows stay distinct', () => {
    const result = parseTherapiesFromCsv(SAMPLE_CSV);
    const occupationalBlock = result.sessions.filter(
      (session) => session.date === '2026-09-09' && session.specialty === 'TERAPIA OCUPACIONAL'
    );

    expect(occupationalBlock.map((session) => session.sessionIndex)).toEqual([1, 2, 3]);
    expect(new Set(occupationalBlock.map((session) => session.importHash)).size).toBe(3);
  });

  it('accepts a specialty change inside the same therapist/day block', () => {
    const result = parseTherapiesFromCsv(SAMPLE_CSV);
    const johanna = result.sessions.filter(
      (session) => session.date === '2026-09-29' && session.therapistName === 'LIC JOHANNA RAMETA'
    );

    expect(johanna.length).toBe(5);
    expect(new Set(johanna.map((session) => session.importHash)).size).toBe(5);
  });

  it('ignores the consolidated summary section', () => {
    const result = parseTherapiesFromCsv(SAMPLE_CSV);

    expect(result.sessions.some((session) => session.therapistName.includes('Especialidad'))).toBe(
      false
    );
    expect(result.sessions.length).toBe(10);
    expect(result.summary.totalAmountUsd).toBe(150);
  });

  it('reports rows without therapist or specialty instead of importing them', () => {
    const csv = `#,Fecha,Terapeuta,Especialidad,Dia,Punto,Pago Movil,Efectivo,Tasa BCV,Divisas,TOTAL,Observaciones
1,2026-09-09,,TERAPIA OCUPACIONAL,MIERCOLES,,,,820.1,15,,COMPLETO
2,2026-09-09,TSU CATHERIN CAMARA,,MIERCOLES,,,,820.1,15,,COMPLETO`;

    const result = parseTherapiesFromCsv(csv);

    expect(result.sessions.length).toBe(0);
    expect(result.errors.map((error) => error.rowNumber)).toEqual([2, 3]);
  });

  it('prefers the operational worksheet over the consolidated summary sheet', async () => {
    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('Resumen de Terapias');
    summarySheet.addRow(['', 'RESUMEN CONSOLIDADO DE TERAPIAS']);

    const controlSheet = workbook.addWorksheet('Control de Terapias');
    controlSheet.addRow([
      '#',
      'Fecha',
      'Terapeuta',
      'Especialidad',
      'Dia',
      'Punto',
      'Pago Movil',
      'Efectivo',
      'Tasa BCV',
      'Divisas',
      'TOTAL',
      'Observaciones',
    ]);
    controlSheet.addRow([
      1,
      new Date('2026-09-09T00:00:00.000Z'),
      'LIC JOHANNA RAMETA',
      'TERAPIA OCUPACIONAL',
      'MIERCOLES',
      null,
      null,
      null,
      820.1,
      15,
      { formula: 'ROUND(J2*I2,2)' },
      'COMPLETO',
    ]);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const result = await parseTherapiesFromBuffer(buffer);

    expect(result.sessions.length).toBe(1);
    expect(result.sessions[0].therapistName).toBe('LIC JOHANNA RAMETA');
    expect(result.sessions[0].totalBs).toBe(12301.5);
    expect(result.sessions[0].dayOfWeekName).toBe('MIERCOLES');
  });
});
