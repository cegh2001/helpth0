import ExcelJS from 'exceljs';
import { Consultation } from '@/core/domain/entities/consultation.entity';
import {
  ConsultationParserPort,
  ParseConsultationRowError,
  ParseConsultationsResult,
  ParseConsultationsSummary,
} from '@/core/application/ports/consultation-parser.port';
import {
  parseNumeric,
  computeExoneration,
  buildConsultationsSummary,
} from './consultation-exoneration.calculator';
import { parseConsultationsFromCsv } from './consultation-csv.parser';
import { normalizeToIsoDate } from '@/lib/date-utils';

export {
  type ParseConsultationRowError,
  type ParseConsultationsResult,
  type ParseConsultationsSummary,
  parseConsultationsFromCsv,
};

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

    const dateStr = normalizeToIsoDate(vals[2]);
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
    let amountUsd = parseNumeric(vals[13]);
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
    if (paidBs > 0) {
      if (totalBs <= 0) totalBs = paidBs;
      if (amountUsd <= 0 && bcvRate > 0) {
        amountUsd = Number((paidBs / bcvRate).toFixed(2));
      }
    } else if (amountUsd > 0 && bcvRate > 0 && totalBs <= 0) {
      totalBs = Number((amountUsd * bcvRate).toFixed(2));
    }

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
    summary: buildConsultationsSummary(consultations, dates),
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
