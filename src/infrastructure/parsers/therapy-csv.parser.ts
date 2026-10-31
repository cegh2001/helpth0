import { TherapySession } from '@/core/domain/entities/therapy-session.entity';
import {
  ParseTherapiesResult,
  ParseTherapiesSummary,
  ParseTherapyRowError,
} from '@/core/application/ports/therapy-parser.port';
import {
  computeExoneration,
  parseNumeric,
} from './consultation-exoneration.calculator';
import { splitCsvLine } from './medical-exam-csv.parser';

const CSV_SUMMARY_MARKERS = [
  'RESUMEN CONSOLIDADO',
  'DISTRIBUCIÓN POR PROFESIONAL',
  'CLASIFICACIÓN POR ESTATUS',
  'TOTAL GENERAL',
  'TOTAL TERAPIAS',
  'TOTAL PROFESIONALES',
  'TOTAL PACIENTES',
  'TOTAL SESIONES',
];

export function buildTherapiesSummary(
  sessions: TherapySession[],
  dates: string[]
): ParseTherapiesSummary {
  const sortedDates = [...dates].sort();
  const bcvRates = sessions.map((c) => c.bcvRate).filter((r) => r > 0);

  return {
    totalParsed: sessions.length,
    totalAmountUsd: Number(sessions.reduce((sum, c) => sum + c.amountUsd, 0).toFixed(2)),
    totalAmountBs: Number(sessions.reduce((sum, c) => sum + c.totalBs, 0).toFixed(2)),
    totalExoneratedUsd: Number(
      sessions.reduce((sum, c) => sum + c.exoneratedAmountUsd, 0).toFixed(2)
    ),
    exoneratedSessionsCount: sessions.filter((c) => c.exonerationPercent > 0).length,
    averageBcvRate:
      bcvRates.length > 0
        ? Number((bcvRates.reduce((sum, r) => sum + r, 0) / bcvRates.length).toFixed(2))
        : 0,
    minBcvRate: bcvRates.length > 0 ? Math.min(...bcvRates) : 0,
    maxBcvRate: bcvRates.length > 0 ? Math.max(...bcvRates) : 0,
    uniqueTherapists: Array.from(new Set(sessions.map((c) => c.therapistName))),
    uniqueSpecialties: Array.from(new Set(sessions.map((c) => c.specialty))),
    dateRange:
      sortedDates.length > 0
        ? { min: sortedDates[0], max: sortedDates[sortedDates.length - 1] }
        : null,
  };
}

export function parseTherapiesFromCsv(csvText: string): ParseTherapiesResult {
  const lines = csvText.split(/\r?\n/);
  const sessions: TherapySession[] = [];
  const errors: ParseTherapyRowError[] = [];
  const dates: string[] = [];
  let inDataSection = false;

  for (let i = 0; i < lines.length; i++) {
    const rowNumber = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    const upper = line.toUpperCase();
    if (CSV_SUMMARY_MARKERS.some((marker) => upper.startsWith(`,"${marker}`) || upper.includes(marker))) {
      break;
    }

    const parts = splitCsvLine(line);
    const firstCol = parts[0];

    if (
      firstCol === '#' &&
      parts.some((p) => p.toLowerCase().includes('fecha')) &&
      parts.some((p) => p.toLowerCase().includes('terapeuta'))
    ) {
      inDataSection = true;
      continue;
    }

    if (!inDataSection) continue;

    const dateCandidate = parts[1] ?? '';
    const isIndex = /^\d+$/.test(firstCol);
    if (!isIndex || !/^\d{4}-\d{2}-\d{2}$/.test(dateCandidate)) {
      continue;
    }

    const therapistName = (parts[2] ?? '').trim();
    const specialty = (parts[3] ?? '').trim();

    if (!therapistName || !specialty) {
      errors.push({
        rowNumber,
        message: 'Fila sin terapeuta o especialidad requeridos',
      });
      continue;
    }

    const amountPointBs = parseNumeric(parts[5]);
    const amountMobileBs = parseNumeric(parts[6]);
    const amountCashBs = parseNumeric(parts[7]);
    const bcvRate = parseNumeric(parts[8]);
    let amountUsd = parseNumeric(parts[9]);
    const totalBs = parseNumeric(parts[10]);
    const observations = (parts[11] ?? '').trim() || null;

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
        date: dateCandidate,
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
      dates.push(dateCandidate);
    } catch (err) {
      errors.push({
        rowNumber,
        message: err instanceof Error ? err.message : 'Error desconocido al procesar fila',
      });
    }
  }

  return {
    sessions,
    errors,
    summary: buildTherapiesSummary(sessions, dates),
  };
}
