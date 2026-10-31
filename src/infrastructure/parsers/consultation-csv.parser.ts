import { Consultation } from '@/core/domain/entities/consultation.entity';
import {
  ParseConsultationRowError,
  ParseConsultationsResult,
} from '@/core/application/ports/consultation-parser.port';
import {
  parseNumeric,
  computeExoneration,
  buildConsultationsSummary,
} from './consultation-exoneration.calculator';

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
    summary: buildConsultationsSummary(consultations, dates),
  };
}
