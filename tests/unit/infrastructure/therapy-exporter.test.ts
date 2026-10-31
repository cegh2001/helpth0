import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { ExcelJsTherapyExporter } from '@/infrastructure/exporters/therapy-excel.exporter';
import { parseTherapiesFromBuffer } from '@/infrastructure/parsers/therapy-excel.parser';
import { TherapySession } from '@/core/domain/entities/therapy-session.entity';

function buildSessions(): TherapySession[] {
  return [
    TherapySession.create({
      date: '2026-09-09',
      therapistName: 'LIC JOHANNA RAMETA',
      specialty: 'TERAPIA OCUPACIONAL',
      sessionIndex: 1,
      bcvRate: 820.1,
      amountUsd: 15,
      observations: 'COMPLETO',
    }),
    TherapySession.create({
      date: '2026-09-09',
      therapistName: 'TSU CATHERIN CAMARA',
      specialty: 'FISIOTERAPEUTA',
      sessionIndex: 1,
      bcvRate: 820.1,
      amountUsd: 15,
      observations: 'COMPLETO',
    }),
  ];
}

async function flattenSheetValues(buffer: Buffer): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.getWorksheet('Control de Terapias');
  const values: string[] = [];

  sheet?.eachRow((row) => {
    (row.values as unknown[]).forEach((cell) => {
      if (typeof cell === 'string') values.push(cell);
    });
  });

  return values;
}

describe('ExcelJsTherapyExporter', () => {
  it('writes the operational detail with the derived day and the billed Bs total', async () => {
    const buffer = await new ExcelJsTherapyExporter().exportToExcel(buildSessions(), 'SEPTIEMBRE 2026');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('Control de Terapias');

    expect(sheet?.getRow(2).getCell(3).value).toBe('LIC JOHANNA RAMETA');
    expect(sheet?.getRow(2).getCell(5).value).toBe('MIERCOLES');
    expect(sheet?.getRow(2).getCell(11).value).toBe(12301.5);
  });

  it('labels the consolidated matrices with sessions instead of patients', async () => {
    const values = await flattenSheetValues(
      await new ExcelJsTherapyExporter().exportToExcel(buildSessions(), 'SEPTIEMBRE 2026')
    );

    expect(values).toContain('Sesiones Atendidos');
    expect(values).toContain('TOTAL SESIONES');
    expect(values).not.toContain('Pacientes Atendidos');
    expect(values).not.toContain('TOTAL PACIENTES');
  });

  it('round-trips through its own parser without creating duplicate identities', async () => {
    const sessions = buildSessions();
    const buffer = await new ExcelJsTherapyExporter().exportToExcel(sessions, 'SEPTIEMBRE 2026');
    const parsed = await parseTherapiesFromBuffer(buffer);

    expect(parsed.errors).toEqual([]);
    expect(parsed.sessions.length).toBe(sessions.length);
    expect(parsed.sessions.map((session) => session.importHash).sort()).toEqual(
      sessions.map((session) => session.importHash).sort()
    );
  });
});
