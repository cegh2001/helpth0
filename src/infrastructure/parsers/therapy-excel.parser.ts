import ExcelJS from 'exceljs';
import { TherapySession } from '@/core/domain/entities/therapy-session.entity';
import {
  ParseTherapiesResult,
  ParseTherapyRowError,
  TherapyParserPort,
} from '@/core/application/ports/therapy-parser.port';
import {
  computeExoneration,
  parseNumeric,
} from './consultation-exoneration.calculator';
import {
  buildTherapiesSummary,
  parseTherapiesFromCsv,
} from './therapy-csv.parser';
import { normalizeToIsoDate } from '@/lib/date-utils';

export {
  type ParseTherapyRowError,
  type ParseTherapiesResult,
  type ParseTherapiesSummary,
} from '@/core/application/ports/therapy-parser.port';
export { parseTherapiesFromCsv } from './therapy-csv.parser';

function formatDateValue(val: unknown): string {
  return normalizeToIsoDate(val);
}

function readTotalCell(val: unknown): number {
  if (val && typeof val === 'object' && 'result' in (val as Record<string, unknown>)) {
    return parseNumeric((val as Record<string, unknown>).result);
  }
  return parseNumeric(val);
}

function selectTherapyWorksheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  const candidates = workbook.worksheets.filter((w) => {
    const name = w.name.toLowerCase();
    if (name.includes('resumen')) return false;
    return name.includes('control') || name.includes('terapia') || name.includes('fisio');
  });

  return candidates.find((w) => w.name.toLowerCase().includes('control')) ??
    candidates[0] ??
    workbook.worksheets[0];
}

export async function parseTherapiesFromBuffer(buffer: Buffer): Promise<ParseTherapiesResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const worksheet = selectTherapyWorksheet(workbook);

  if (!worksheet) {
    return {
      sessions: [],
      errors: [{ rowNumber: 0, message: 'El archivo Excel no contiene hojas de cálculo válidas' }],
      summary: buildTherapiesSummary([], []),
    };
  }

  const sessions: TherapySession[] = [];
  const errors: ParseTherapyRowError[] = [];
  const dates: string[] = [];
  let inDataSection = false;

  worksheet.eachRow((row, rowNumber) => {
    const vals = row.values as Array<unknown>;
    if (!vals || !Array.isArray(vals)) return;

    const isHeaderRow =
      vals.some((v) => typeof v === 'string' && v.includes('Fecha')) &&
      vals.some((v) => typeof v === 'string' && v.includes('Terapeuta'));

    if (isHeaderRow) {
      inDataSection = true;
      return;
    }

    if (!inDataSection) return;

    const firstCol = vals[1];
    if (firstCol == null || isNaN(Number(firstCol))) return;

    const dateStr = formatDateValue(vals[2]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

    const therapistName = String(vals[3] ?? '').trim();
    const specialty = String(vals[4] ?? '').trim();

    if (!therapistName || !specialty) {
      errors.push({
        rowNumber,
        message: 'Fila sin terapeuta o especialidad requeridos',
      });
      return;
    }

    const amountPointBs = parseNumeric(vals[6]);
    const amountMobileBs = parseNumeric(vals[7]);
    const amountCashBs = parseNumeric(vals[8]);
    const bcvRate = parseNumeric(vals[9]);
    let amountUsd = parseNumeric(vals[10]);
    const totalBs = readTotalCell(vals[11]);
    const obsVal = vals[12];
    const observations = obsVal ? String(obsVal).trim() : null;

    const paidBs = amountPointBs + amountMobileBs + amountCashBs;
    if (paidBs > 0 && amountUsd <= 0 && bcvRate > 0) {
      amountUsd = Number((paidBs / bcvRate).toFixed(2));
    }

    const { status, exonerationPercent, exoneratedAmountUsd } = computeExoneration(
      observations,
      amountUsd,
      bcvRate,
      paidBs
    );

    try {
      const item = TherapySession.create({
        date: dateStr,
        therapistName,
        specialty,
        sessionIndex: Number(firstCol),
        amountPointBs,
        amountMobileBs,
        amountCashBs,
        bcvRate,
        amountUsd,
        totalBs,
        status,
        exonerationPercent,
        exoneratedAmountUsd,
        observations,
      });

      sessions.push(item);
      dates.push(dateStr);
    } catch (err) {
      errors.push({
        rowNumber,
        message: err instanceof Error ? err.message : 'Error desconocido al procesar fila',
      });
    }
  });

  return {
    sessions,
    errors,
    summary: buildTherapiesSummary(sessions, dates),
  };
}

export class TherapyExcelParser implements TherapyParserPort {
  parseFromCsv(csvText: string): ParseTherapiesResult {
    return parseTherapiesFromCsv(csvText);
  }

  async parseFromBuffer(buffer: Buffer): Promise<ParseTherapiesResult> {
    return parseTherapiesFromBuffer(buffer);
  }
}
