import ExcelJS from 'exceljs';
import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';
import {
  MedicalExamParserPort,
  ParseMedicalExamRowError,
  ParseMedicalExamsResult,
  ParseMedicalExamsSummary,
} from '@/core/application/ports/medical-exam-parser.port';
import {
  parseNumeric,
  computeExoneration,
} from './consultation-exoneration.calculator';
import {
  parseMedicalExamsFromCsv,
  buildMedicalExamsSummary,
} from './medical-exam-csv.parser';

export {
  type ParseMedicalExamRowError,
  type ParseMedicalExamsResult,
  type ParseMedicalExamsSummary,
  parseMedicalExamsFromCsv,
};

function formatDateValue(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  return '';
}

export async function parseMedicalExamsFromBuffer(buffer: Buffer): Promise<ParseMedicalExamsResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const worksheet =
    workbook.worksheets.find(
      (w) =>
        w.name.toLowerCase().includes('examen') ||
        w.name.toLowerCase().includes('laboratorio') ||
        w.name.toLowerCase().includes('pago')
    ) || workbook.worksheets[0];

  if (!worksheet) {
    return {
      exams: [],
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
        dateRange: null,
      },
    };
  }

  const exams: MedicalExam[] = [];
  const errors: ParseMedicalExamRowError[] = [];
  let inDataSection = false;
  const dates: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const vals = row.values as Array<unknown>;
    if (!vals || !Array.isArray(vals)) return;

    const isHeaderRow =
      vals.some((v) => typeof v === 'string' && v.includes('Fecha')) &&
      vals.some(
        (v) =>
          typeof v === 'string' &&
          (v.includes('Cedula') || v.includes('Nombre') || v.includes('Examen'))
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

    const dateStr = formatDateValue(vals[2]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

    const patientName = String(vals[3] || '').trim();
    const rawCedula = vals[4];
    const cedula = rawCedula != null ? String(rawCedula).replace(/[^\d]/g, '') : null;
    const birthDate = formatDateValue(vals[5]) || null;
    const phone = vals[6] ? String(vals[6]).trim() : null;
    const address = vals[7] ? String(vals[7]).trim() : null;
    const examName = vals[8] ? String(vals[8]).trim() : null;

    if (!patientName) {
      errors.push({
        rowNumber,
        message: 'Fila sin nombre de paciente requerido',
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
      const item = MedicalExam.create({
        date: dateStr,
        patientName,
        patientCedula: cedula || null,
        patientBirthDate: birthDate,
        patientPhone: phone,
        patientAddress: address,
        examName,
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

      exams.push(item);
      dates.push(dateStr);
    } catch (err) {
      errors.push({
        rowNumber,
        message: err instanceof Error ? err.message : 'Error desconocido al procesar fila',
      });
    }
  });

  return {
    exams,
    errors,
    summary: buildMedicalExamsSummary(exams, dates),
  };
}

export class MedicalExamExcelParser implements MedicalExamParserPort {
  parseFromCsv(csvText: string): ParseMedicalExamsResult {
    return parseMedicalExamsFromCsv(csvText);
  }

  async parseFromBuffer(buffer: Buffer): Promise<ParseMedicalExamsResult> {
    return parseMedicalExamsFromBuffer(buffer);
  }
}
