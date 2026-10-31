import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
  buildWrongModuleMessage,
  classifyWorkbookModule,
  scanWorkbook,
  WorkbookModuleGuard,
} from '@/infrastructure/parsers/workbook-module-guard';

const THERAPY_HEADER = [
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
];

const CONSULTATION_HEADER = [
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
];

const EXAM_HEADER = [
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
  'Observaciones',
];

interface SheetFixture {
  name: string;
  rows: string[][];
}

async function buildBuffer(sheets: SheetFixture[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    for (const row of sheet.rows) worksheet.addRow(row);
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function buildWorkbook(sheets: SheetFixture[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    for (const row of sheet.rows) worksheet.addRow(row);
  }
  return workbook;
}

const THERAPY_SHEETS: SheetFixture[] = [
  {
    name: 'Control de Terapias',
    rows: [['#', ''], THERAPY_HEADER, ['1', '2026-09-09', 'LIC JOHANNA RAMETA', 'TERAPIA OCUPACIONAL']],
  },
  { name: 'Resumen de Terapias', rows: [['RESUMEN CONSOLIDADO DE TERAPIAS - SEPTIEMBRE']] },
];

const CONSULTATION_SHEETS: SheetFixture[] = [
  {
    name: 'Control de Pago',
    rows: [
      ['#', ''],
      CONSULTATION_HEADER,
      ['1', '2026-10-01', 'LEONARDO BNOLIVAR', '7996174', 'CARABALLEDA', '4127109167', 'DRA MAILET'],
    ],
  },
  { name: 'Resumen de Consultas', rows: [['RESUMEN CONSOLIDADO DE CONSULTAS Y PACIENTES']] },
];

const EXAM_SHEETS: SheetFixture[] = [
  {
    name: 'Control de Pago',
    rows: [
      ['#', ''],
      EXAM_HEADER,
      ['1', '2026-09-28', 'ZORAIDA FERNANDEZ', '11639560', '1973-03-28', '4149211060', 'CARABALLEDA'],
    ],
  },
  { name: 'Resumen de Exámenes', rows: [['RESUMEN CONSOLIDADO DE EXÁMENES Y LABORATORIO']] },
];

describe('classifyWorkbookModule', () => {
  it('identifies a therapies workbook despite the shared payment sheet name', () => {
    expect(classifyWorkbookModule(scanWorkbook(buildWorkbook(THERAPY_SHEETS)))).toBe('terapias');
  });

  it('identifies a consultations workbook', () => {
    expect(classifyWorkbookModule(scanWorkbook(buildWorkbook(CONSULTATION_SHEETS)))).toBe('consultas');
  });

  it('identifies an exams workbook and normalizes accented sheet names', () => {
    expect(classifyWorkbookModule(scanWorkbook(buildWorkbook(EXAM_SHEETS)))).toBe('examenes');
  });

  it('returns null when the workbook carries no recognizable signal', () => {
    const workbook = buildWorkbook([
      { name: 'Hoja1', rows: [['Nombre', 'Monto'], ['Cualquiera', '100']] },
    ]);

    expect(classifyWorkbookModule(scanWorkbook(workbook))).toBeNull();
  });

  it('refuses to guess when two modules score the same', () => {
    const workbook = buildWorkbook([{ name: 'Control de Terapias y Consultas', rows: [['#']] }]);

    expect(classifyWorkbookModule(scanWorkbook(workbook))).toBeNull();
  });

  it('ignores summary sheets when reading header labels', () => {
    const workbook = buildWorkbook([
      ...THERAPY_SHEETS,
      { name: 'Resumen de Exámenes', rows: [['Terapeuta', 'Examenes']] },
    ]);

    expect(scanWorkbook(workbook).headerLabels).not.toContain('examenes');
  });
});

describe('WorkbookModuleGuard', () => {
  const guard = new WorkbookModuleGuard();

  it('accepts a workbook imported into its own module', async () => {
    expect(await guard.detectWrongModule(await buildBuffer(THERAPY_SHEETS), 'terapias')).toBeNull();
    expect(
      await guard.detectWrongModule(await buildBuffer(CONSULTATION_SHEETS), 'consultas')
    ).toBeNull();
    expect(await guard.detectWrongModule(await buildBuffer(EXAM_SHEETS), 'examenes')).toBeNull();
  });

  it('rejects a therapies sheet uploaded as consultations and explains where it belongs', async () => {
    const rejection = await guard.detectWrongModule(await buildBuffer(THERAPY_SHEETS), 'consultas');

    expect(rejection).toStrictEqual({
      detected: 'terapias',
      expected: 'consultas',
      message:
        'Este archivo es de Terapias (fisioterapia) y lo estás subiendo en Consultas. No se importó ningún dato: subilo desde el módulo de Terapias (fisioterapia).',
    });
  });

  it('rejects a consultations sheet uploaded as exams', async () => {
    const rejection = await guard.detectWrongModule(
      await buildBuffer(CONSULTATION_SHEETS),
      'examenes'
    );

    expect(rejection?.detected).toBe('consultas');
    expect(rejection?.message).toBe(
      'Este archivo es de Consultas y lo estás subiendo en Exámenes. No se importó ningún dato: subilo desde el módulo de Consultas.'
    );
  });

  it('rejects an exams sheet uploaded as therapies', async () => {
    const rejection = await guard.detectWrongModule(await buildBuffer(EXAM_SHEETS), 'terapias');

    expect(rejection?.detected).toBe('examenes');
  });

  it('leaves legacy and unrecognized workbooks to the parser', async () => {
    const unknown = await buildBuffer([{ name: 'Hoja1', rows: [['Nombre', 'Monto']] }]);

    expect(await guard.detectWrongModule(unknown, 'consultas')).toBeNull();
  });
});

describe('buildWrongModuleMessage', () => {
  it('names both the detected module and the module the user opened', () => {
    expect(buildWrongModuleMessage('examenes', 'terapias')).toBe(
      'Este archivo es de Exámenes y lo estás subiendo en Terapias (fisioterapia). No se importó ningún dato: subilo desde el módulo de Exámenes.'
    );
  });
});
