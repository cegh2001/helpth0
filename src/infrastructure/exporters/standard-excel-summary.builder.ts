import ExcelJS from 'exceljs';
import {
  appendExonerationExcelSummary,
  ExonerationRowItem,
} from './exoneration-excel-summary.builder';
import { formatDisplayDate } from '@/lib/date-utils';

export type SummaryRowItem = ExonerationRowItem;

export function getWeekBucket(dateStr: string): string {
  let day = 1;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    day = parts[0].length === 4 ? parseInt(parts[2], 10) : parseInt(parts[0], 10);
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    day = parts[0].length === 4 ? parseInt(parts[2], 10) : parseInt(parts[0], 10);
  } else {
    day = parseInt(dateStr.slice(8, 10), 10);
  }
  if (isNaN(day)) day = 1;
  if (day <= 7) return 'Semana 1';
  if (day <= 14) return 'Semana 2';
  if (day <= 21) return 'Semana 3';
  return 'Semana 4';
}

export function appendStandardExcelSummary(
  sheet: ExcelJS.Worksheet,
  items: SummaryRowItem[],
  moduleTitle: string,
  titlePeriod: string,
  subjectLabel = 'Pacientes',
  options?: { showTarifaBase?: boolean }
): void {
  const showTarifaBase = options?.showTarifaBase ?? (moduleTitle !== 'EXÁMENES Y LABORATORIO');

  // Ensure Column B is wide enough for descriptive labels like "Aporte Fijo Congregación ($10)"
  const colB = sheet.getColumn(2);
  if ((colB.width ?? 0) < 38) {
    colB.width = 38;
  }

  const subjectPlural = subjectLabel.trim() || 'Pacientes';
  sheet.addRow([]); // Blank line

  // 1. Weekly breakdown matrix
  const weeklyHeaderTitle = sheet.addRow([
    '',
    `RESUMEN CONSOLIDADO DE ${moduleTitle.toUpperCase()} - ${titlePeriod.toUpperCase()}`,
  ]);
  weeklyHeaderTitle.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };

  const weeklyCols = sheet.addRow([
    '',
    'Semana',
    `${subjectPlural} Atendidos`,
    'Total Divisas ($)',
    'Cobrado Punto (Bs)',
    'Cobrado Pago Móvil (Bs)',
    'Cobrado Efectivo (Bs)',
    'Total Facturado (Bs)',
  ]);
  weeklyCols.font = { bold: true };
  weeklyCols.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  const weekOrder = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
  const weekMap = new Map<
    string,
    { count: number; usd: number; pointBs: number; mobileBs: number; cashBs: number; totalBs: number }
  >();

  for (const w of weekOrder) {
    weekMap.set(w, { count: 0, usd: 0, pointBs: 0, mobileBs: 0, cashBs: 0, totalBs: 0 });
  }

  for (const item of items) {
    const bucket = getWeekBucket(item.date);
    const cur = weekMap.get(bucket) || { count: 0, usd: 0, pointBs: 0, mobileBs: 0, cashBs: 0, totalBs: 0 };
    cur.count++;
    cur.usd += item.amountUsd;
    cur.pointBs += item.amountPointBs;
    cur.mobileBs += item.amountMobileBs;
    cur.cashBs += item.amountCashBs;
    cur.totalBs += item.totalBs;
    weekMap.set(bucket, cur);
  }

  let totalPatients = 0;
  let totalUsd = 0;
  let totalPointBs = 0;
  let totalMobileBs = 0;
  let totalCashBs = 0;
  let totalFacturadoBs = 0;

  for (const w of weekOrder) {
    const data = weekMap.get(w)!;
    totalPatients += data.count;
    totalUsd += data.usd;
    totalPointBs += data.pointBs;
    totalMobileBs += data.mobileBs;
    totalCashBs += data.cashBs;
    totalFacturadoBs += data.totalBs;

    const row = sheet.addRow([
      '',
      w,
      data.count,
      data.usd > 0 ? data.usd : '',
      data.pointBs > 0 ? data.pointBs : '',
      data.mobileBs > 0 ? data.mobileBs : '',
      data.cashBs > 0 ? data.cashBs : '',
      data.totalBs > 0 ? data.totalBs : '',
    ]);

    [4, 5, 6, 7, 8].forEach((cIdx) => {
      const cell = row.getCell(cIdx);
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
      }
    });
  }

  const weeklyTotalRow = sheet.addRow([
    '',
    `TOTAL ${subjectPlural.toUpperCase()}`,
    totalPatients,
    totalUsd,
    totalPointBs,
    totalMobileBs,
    totalCashBs,
    totalFacturadoBs,
  ]);
  weeklyTotalRow.font = { bold: true };
  weeklyTotalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCBD5E1' },
  };
  [4, 5, 6, 7, 8].forEach((cIdx) => {
    const cell = weeklyTotalRow.getCell(cIdx);
    if (typeof cell.value === 'number') {
      cell.numFmt = '#,##0.00';
    }
  });

  sheet.addRow([]); // Blank line
  sheet.addRow([]); // Blank line

  // 2. Control de pagos pendientes en el período
  const pendingItems = items.filter((item) => {
    const raw = `${item.status ?? ''} ${item.observations ?? ''}`.toUpperCase();
    return raw.includes('PENDIENTE');
  });

  if (pendingItems.length > 0) {
    const pendingHeaderTitle = sheet.addRow(['', 'DETALLE DE CASOS PENDIENTES DE PAGO EN EL PERÍODO']);
    pendingHeaderTitle.font = { bold: true, size: 12, color: { argb: 'FF991B1B' } };

    const pendingCols = sheet.addRow([
      '',
      'Fecha',
      `Paciente / Caso`,
      'Especialidad / Detalle',
      'Monto Pendiente ($)',
      'Condición / Estatus',
    ]);
    pendingCols.font = { bold: true };
    pendingCols.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEE2E2' },
    };

    let totalPendingUsd = 0;
    for (const item of pendingItems) {
      totalPendingUsd = Number((totalPendingUsd + (item.amountUsd > 0 ? item.amountUsd : 0)).toFixed(2));
      const row = sheet.addRow([
        '',
        formatDisplayDate(item.date),
        item.patientName || `Caso ${subjectPlural}`,
        item.specialty || '-',
        item.amountUsd > 0 ? item.amountUsd : '',
        item.observations?.trim() || item.status.trim(),
      ]);

      const cell = row.getCell(5);
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
      }
    }

    const pendingTotalRow = sheet.addRow([
      '',
      'TOTAL CASOS PENDIENTES',
      pendingItems.length,
      '',
      totalPendingUsd > 0 ? totalPendingUsd : '',
      'Seguimiento administrativo requerido',
    ]);
    pendingTotalRow.font = { bold: true, color: { argb: 'FF991B1B' } };
    pendingTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFECACA' },
    };
    const totalCell = pendingTotalRow.getCell(5);
    if (typeof totalCell.value === 'number') {
      totalCell.numFmt = '#,##0.00';
    }
  } else {
    const okHeaderTitle = sheet.addRow(['', 'CONTROL DE PAGOS: 100% SOLVENTE']);
    okHeaderTitle.font = { bold: true, size: 11, color: { argb: 'FF166534' } };
    const okRow = sheet.addRow([
      '',
      'No se registran casos pendientes de pago en el período auditado.',
    ]);
    okRow.font = { italic: true, size: 9, color: { argb: 'FF15803D' } };
  }

  appendExonerationExcelSummary(
    sheet,
    items,
    subjectPlural,
    {
      totalCount: totalPatients,
      totalFacturadoBs,
    },
    { showTarifaBase }
  );
}
