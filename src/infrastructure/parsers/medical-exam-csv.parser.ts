import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';
import {
  ParseMedicalExamRowError,
  ParseMedicalExamsResult,
  ParseMedicalExamsSummary,
} from '@/core/application/ports/medical-exam-parser.port';
import {
  parseNumeric,
  computeExoneration,
} from './consultation-exoneration.calculator';

export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function buildMedicalExamsSummary(
  exams: MedicalExam[],
  dates: string[]
): ParseMedicalExamsSummary {
  dates.sort();
  const totalAmountUsd = exams.reduce((sum, c) => sum + c.amountUsd, 0);
  const totalAmountBs = exams.reduce((sum, c) => sum + c.totalBs, 0);
  const totalExoneratedUsd = Number(
    exams.reduce((sum, c) => sum + c.exoneratedAmountUsd, 0).toFixed(2)
  );
  const exoneratedPatientsCount = exams.filter((c) => c.exonerationPercent > 0).length;

  const bcvRates = exams.map((c) => c.bcvRate).filter((r) => r > 0);
  const minBcvRate = bcvRates.length > 0 ? Math.min(...bcvRates) : 0;
  const maxBcvRate = bcvRates.length > 0 ? Math.max(...bcvRates) : 0;
  const averageBcvRate =
    bcvRates.length > 0
      ? Number((bcvRates.reduce((s, r) => s + r, 0) / bcvRates.length).toFixed(2))
      : 0;

  return {
    totalParsed: exams.length,
    totalAmountUsd,
    totalAmountBs,
    totalExoneratedUsd,
    exoneratedPatientsCount,
    averageBcvRate,
    minBcvRate,
    maxBcvRate,
    dateRange: dates.length > 0 ? { min: dates[0], max: dates[dates.length - 1] } : null,
  };
}

export function parseMedicalExamsFromCsv(csvText: string): ParseMedicalExamsResult {
  const lines = csvText.split(/\r?\n/);
  const exams: MedicalExam[] = [];
  const errors: ParseMedicalExamRowError[] = [];
  let inDataSection = false;
  const dates: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rowNumber = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    const parts = splitCsvLine(line);
    const firstCol = parts[0];

    if (
      firstCol === '#' &&
      parts.some((p) => p.toLowerCase().includes('fecha')) &&
      parts.some(
        (p) =>
          p.toLowerCase().includes('cedula') ||
          p.toLowerCase().includes('nombre') ||
          p.toLowerCase().includes('examenes')
      )
    ) {
      inDataSection = true;
      continue;
    }

    if (
      line.toUpperCase().includes('RESUMEN CONSOLIDADO') ||
      line.toUpperCase().includes('CLASIFICACIÓN POR ESTATUS') ||
      line.toUpperCase().includes('TOTAL GENERAL') ||
      line.toUpperCase().includes('TOTAL PACIENTES')
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
    const birthDate = parts[4] && /^\d{4}-\d{2}-\d{2}$/.test(parts[4]) ? parts[4] : null;
    const phone = parts[5] || null;
    const address = parts[6] || null;
    const examName = parts[7] || null;

    if (!patientName.trim()) {
      errors.push({ rowNumber, message: 'Fila sin nombre de paciente' });
      continue;
    }

    const amountPointBs = parseNumeric(parts[8]);
    const amountMobileBs = parseNumeric(parts[9]);
    const amountCashBs = parseNumeric(parts[10]);
    const bcvRate = parseNumeric(parts[11]);
    let amountUsd = parseNumeric(parts[12]);
    let totalBs = parseNumeric(parts[13]);
    const observations = parts[14] || (parts[13] && isNaN(Number(parts[13])) ? parts[13] : null);

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
        date: dateCandidate,
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
      dates.push(dateCandidate);
    } catch (err) {
      errors.push({
        rowNumber,
        message: err instanceof Error ? err.message : 'Error desconocido al procesar fila',
      });
    }
  }

  return {
    exams,
    errors,
    summary: buildMedicalExamsSummary(exams, dates),
  };
}
