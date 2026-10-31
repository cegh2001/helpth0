import ExcelJS from 'exceljs';
import { Consultation } from '@/core/domain/entities/consultation.entity';
import {
  ConsultationParserPort,
  ParseConsultationRowError,
  ParseConsultationsResult,
  ParseConsultationsSummary,
} from '@/core/application/ports/consultation-parser.port';

export { type ParseConsultationRowError, type ParseConsultationsResult, type ParseConsultationsSummary };

function parseNumeric(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  const clean = str.replace(/[^\d.,-]/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');
    if (lastComma > lastDot) {
      const normalized = clean.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(normalized);
      return isNaN(num) ? 0 : num;
    } else {
      const normalized = clean.replace(/,/g, '');
      const num = parseFloat(normalized);
      return isNaN(num) ? 0 : num;
    }
  }

  if (clean.includes(',')) {
    const normalized = clean.replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function computeExoneration(
  observations: string | null,
  amountUsd: number,
  bcvRate: number,
  paidBs: number
): { status: string; exonerationPercent: number; exoneratedAmountUsd: number } {
  if (!observations) {
    return { status: 'COMPLETO', exonerationPercent: 0, exoneratedAmountUsd: 0 };
  }

  const upper = observations.toUpperCase();
  if (!upper.includes('EXONERAD')) {
    if (upper.includes('PENDIENTE')) {
      return { status: 'PENDIENTE DE PAGO', exonerationPercent: 0, exoneratedAmountUsd: 0 };
    }
    if (upper.includes('REPETICION')) {
      return { status: 'REPETICION', exonerationPercent: 0, exoneratedAmountUsd: 0 };
    }
    return { status: observations, exonerationPercent: 0, exoneratedAmountUsd: 0 };
  }

  const match = upper.match(/(\d{1,3})\s*%/);
  let percent = 0;
  if (match) {
    percent = Math.min(100, Math.max(0, parseInt(match[1], 10)));
  } else if (upper.includes('MITAD') || upper.includes('MEDIA')) {
    percent = 50;
  } else {
    const matchNumber = upper.match(/EXONERAD[AO]S?\s*(?:AL)?\s*(\d{1,3})/);
    if (matchNumber) {
      percent = Math.min(100, Math.max(0, parseInt(matchNumber[1], 10)));
    } else {
      const expectedBs = amountUsd * bcvRate;
      if (paidBs <= 0 || expectedBs <= 0) {
        percent = 100;
      } else {
        const paidRatio = paidBs / expectedBs;
        if (paidRatio < 0.95) {
          percent = Math.round((1 - paidRatio) * 100);
        } else {
          percent = 100;
        }
      }
    }
  }

  const status = percent === 100 ? 'EXONERADO 100%' : `EXONERADO ${percent}%`;
  const exoneratedAmountUsd = Number(((amountUsd * percent) / 100).toFixed(2));

  return { status, exonerationPercent: percent, exoneratedAmountUsd };
}

function buildSummary(consultations: Consultation[], dates: string[]): ParseConsultationsSummary {
  dates.sort();
  const doctors = Array.from(new Set(consultations.map((c) => c.doctorName)));
  const specialties = Array.from(new Set(consultations.map((c) => c.specialty)));
  const totalAmountUsd = consultations.reduce((sum, c) => sum + c.amountUsd, 0);
  const totalAmountBs = consultations.reduce((sum, c) => sum + c.totalBs, 0);
  const totalExoneratedUsd = Number(
    consultations.reduce((sum, c) => sum + c.exoneratedAmountUsd, 0).toFixed(2)
  );
  const exoneratedPatientsCount = consultations.filter((c) => c.exonerationPercent > 0).length;

  const bcvRates = consultations.map((c) => c.bcvRate).filter((r) => r > 0);
  const minBcvRate = bcvRates.length > 0 ? Math.min(...bcvRates) : 0;
  const maxBcvRate = bcvRates.length > 0 ? Math.max(...bcvRates) : 0;
  const averageBcvRate =
    bcvRates.length > 0
      ? Number((bcvRates.reduce((s, r) => s + r, 0) / bcvRates.length).toFixed(2))
      : 0;

  return {
    totalParsed: consultations.length,
    totalAmountUsd,
    totalAmountBs,
    totalExoneratedUsd,
    exoneratedPatientsCount,
    averageBcvRate,
    minBcvRate,
    maxBcvRate,
    uniqueDoctors: doctors,
    uniqueSpecialties: specialties,
    dateRange: dates.length > 0 ? { min: dates[0], max: dates[dates.length - 1] } : null,
  };
}

export function parseConsultationsFromCsv(csvText: string): ParseConsultationsResult {
  const lines = csvText.split(/\r?\n/);
  const consultations: Consultation[] = [];
  const errors: ParseConsultationRowError[] = [];
  let inDataSection = false;
  const dates: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rowNumber = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map((p) => p.trim());
    const firstCol = parts[0];

    if (
      firstCol === '#' &&
      parts.some((p) => p.toLowerCase().includes('fecha')) &&
      parts.some((p) => p.toLowerCase().includes('cedula') || p.toLowerCase().includes('nombre'))
    ) {
      inDataSection = true;
      continue;
    }

    if (
      line.toUpperCase().includes('RESUMEN CONSOLIDADO') ||
      line.toUpperCase().includes('DISTRIBUCIÓN SEMANAL') ||
      line.toUpperCase().includes('TOTAL GENERAL') ||
      line.toUpperCase().includes('TOTAL ACUMULADO')
    ) {
      break;
    }

    if (!inDataSection) continue;

    const isIndex = /^\d+$/.test(firstCol);
    const dateCandidate = parts[1] ?? '';
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateCandidate);

    if (!isIndex || !isValidDate) {
      continue;
    }

    const patientName = parts[2] ?? '';
    const cedula = parts[3] ? parts[3].replace(/[^\d]/g, '') : null;
    const address = parts[4] || null;
    const phone = parts[5] || null;
    const doctorName = parts[6] ?? '';
    const specialty = parts[7] ?? '';

    if (!patientName.trim()) {
      errors.push({ rowNumber, message: 'Fila sin nombre de paciente' });
      continue;
    }
    if (!doctorName.trim()) {
      errors.push({ rowNumber, message: 'Fila sin nombre de médico' });
      continue;
    }
    if (!specialty.trim()) {
      errors.push({ rowNumber, message: 'Fila sin especialidad' });
      continue;
    }

    const amountPointBs = parseNumeric(parts[8]);
    const amountMobileBs = parseNumeric(parts[9]);
    const amountCashBs = parseNumeric(parts[10]);
    const bcvRate = parseNumeric(parts[11]);
    const amountUsd = parseNumeric(parts[12]);
    const totalBs = parseNumeric(parts[13]);
    const observations = parts[14] || (parts[13] && isNaN(Number(parts[13])) ? parts[13] : null);

    const paidBs = amountPointBs + amountMobileBs + amountCashBs;
    const { status, exonerationPercent, exoneratedAmountUsd } = computeExoneration(
      observations,
      amountUsd,
      bcvRate,
      paidBs
    );

    try {
      const item = Consultation.create({
        date: dateCandidate,
        patientName,
        patientCedula: cedula || null,
        patientPhone: phone,
        patientAddress: address,
        doctorName,
        specialty,
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

      consultations.push(item);
      dates.push(dateCandidate);
    } catch (err) {
      errors.push({
        rowNumber,
        message: err instanceof Error ? err.message : 'Error desconocido al procesar fila',
      });
    }
  }

  return {
    consultations,
    errors,
    summary: buildSummary(consultations, dates),
  };
}

export async function parseConsultationsFromBuffer(buffer: Buffer): Promise<ParseConsultationsResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const worksheet =
    workbook.worksheets.find((w) => w.name.toLowerCase().includes('pago')) ||
    workbook.worksheets[0];

  if (!worksheet) {
    return {
      consultations: [],
      errors: [{ rowNumber: 0, message: 'El archivo Excel no contiene hojas de cálculo válidas' }],
      summary: {
        totalParsed: 0,
        totalAmountUsd: 0,
        totalAmountBs: 0,
        totalExoneratedUsd: 0,
        exoneratedPatientsCount: 0,
        averageBcvRate: 0,
        minBcvRate: 0,
        maxBcvRate: 0,
        uniqueDoctors: [],
        uniqueSpecialties: [],
        dateRange: null,
      },
    };
  }

  const consultations: Consultation[] = [];
  const errors: ParseConsultationRowError[] = [];
  let inDataSection = false;
  const dates: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const vals = row.values as Array<unknown>;
    if (!vals || !Array.isArray(vals)) return;

    const isHeaderRow =
      vals.some((v) => typeof v === 'string' && v.includes('Fecha')) &&
      vals.some(
        (v) =>
          typeof v === 'string' && (v.includes('Cedula') || v.includes('Nombre') || v.includes('Medicos'))
      );

    if (isHeaderRow) {
      inDataSection = true;
      return;
    }

    if (!inDataSection) return;

    const firstCol = vals[1];
    if (firstCol == null) return;
    const isIndex = !isNaN(Number(firstCol));
    if (!isIndex) return;

    const rawDate = vals[2];
    let dateStr = '';
    if (rawDate instanceof Date) {
      dateStr = rawDate.toISOString().slice(0, 10);
    } else if (typeof rawDate === 'string') {
      dateStr = rawDate.slice(0, 10);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

    const patientName = String(vals[3] || '').trim();
    const rawCedula = vals[4];
    const cedula = rawCedula != null ? String(rawCedula).replace(/[^\d]/g, '') : null;
    const address = vals[5] ? String(vals[5]).trim() : null;
    const phone = vals[6] ? String(vals[6]).trim() : null;
    const doctorName = String(vals[7] || '').trim();
    const specialty = String(vals[8] || '').trim();

    if (!patientName || !doctorName || !specialty) {
      errors.push({
        rowNumber,
        message: 'Fila con campos requeridos vacíos (paciente, médico o especialidad)',
      });
      return;
    }

    const amountPointBs = parseNumeric(vals[9]);
    const amountMobileBs = parseNumeric(vals[10]);
    const amountCashBs = parseNumeric(vals[11]);
    const bcvRate = parseNumeric(vals[12]);
    const amountUsd = parseNumeric(vals[13]);
    const totalBsVal = vals[14];
    let totalBs = 0;
    if (totalBsVal && typeof totalBsVal === 'object' && 'result' in (totalBsVal as Record<string, unknown>)) {
      totalBs = parseNumeric((totalBsVal as Record<string, unknown>).result);
    } else {
      totalBs = parseNumeric(totalBsVal);
    }

    const obsVal = vals[15];
    const observations = obsVal ? String(obsVal).trim() : null;

    const paidBs = amountPointBs + amountMobileBs + amountCashBs;
    const { status, exonerationPercent, exoneratedAmountUsd } = computeExoneration(
      observations,
      amountUsd,
      bcvRate,
      paidBs
    );

    try {
      const item = Consultation.create({
        date: dateStr,
        patientName,
        patientCedula: cedula || null,
        patientPhone: phone,
        patientAddress: address,
        doctorName,
        specialty,
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

      consultations.push(item);
      dates.push(dateStr);
    } catch (err) {
      errors.push({
        rowNumber,
        message: err instanceof Error ? err.message : 'Error desconocido al procesar fila',
      });
    }
  });

  return {
    consultations,
    errors,
    summary: buildSummary(consultations, dates),
  };
}

export class ConsultationCsvParser implements ConsultationParserPort {
  parseFromCsv(csvText: string): ParseConsultationsResult {
    return parseConsultationsFromCsv(csvText);
  }

  async parseFromBuffer(buffer: Buffer): Promise<ParseConsultationsResult> {
    return parseConsultationsFromBuffer(buffer);
  }
}
