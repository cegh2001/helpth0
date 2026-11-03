import ExcelJS from 'exceljs';
import {
  appendExonerationExcelSummary,
  ExonerationRowItem,
} from './exoneration-excel-summary.builder';

export type SummaryRowItem = ExonerationRowItem;

export function getWeekBucket(dateStr: string): string {
  const day = parseInt(dateStr.slice(8, 10), 10);
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
  subjectLabel = 'Pacientes'
): void {
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
    'TOTAL GENERAL',
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

  // 2. Status / Condition matrix
  const statusHeaderTitle = sheet.addRow(['', 'CLASIFICACIÓN POR ESTATUS Y CONDICIÓN DE PAGO']);
  statusHeaderTitle.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };

  const statusCols = sheet.addRow([
    '',
    'Condición / Observación',
    `Cantidad de ${subjectPlural}`,
    'Monto en Divisas ($)',
    'Total Equivalente (Bs)',
    '% de Casos',
  ]);
  statusCols.font = { bold: true };
  statusCols.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  const statusMap = new Map<string, { count: number; usd: number; totalBs: number }>();
  for (const item of items) {
    const rawKey = (item.observations?.trim() || item.status.trim()).toUpperCase();
    const cur = statusMap.get(rawKey) || { count: 0, usd: 0, totalBs: 0 };
    cur.count++;
    cur.usd += item.amountUsd;
    cur.totalBs += item.totalBs;
    statusMap.set(rawKey, cur);
  }

  for (const [statusKey, data] of statusMap.entries()) {
    const percent = items.length > 0 ? ((data.count / items.length) * 100).toFixed(1) + '%' : '0%';
    const row = sheet.addRow([
      '',
      statusKey,
      data.count,
      data.usd > 0 ? data.usd : '',
      data.totalBs > 0 ? data.totalBs : '',
      percent,
    ]);

    [4, 5].forEach((cIdx) => {
      const cell = row.getCell(cIdx);
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
      }
    });
  }

  const statusTotalRow = sheet.addRow([
    '',
    `TOTAL ${subjectPlural.toUpperCase()}`,
    totalPatients,
    totalUsd,
    totalFacturadoBs,
    '100.0%',
  ]);
  statusTotalRow.font = { bold: true };
  statusTotalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCBD5E1' },
  };
  [4, 5].forEach((cIdx) => {
    const cell = statusTotalRow.getCell(cIdx);
    if (typeof cell.value === 'number') {
      cell.numFmt = '#,##0.00';
    }
  });

  appendExonerationExcelSummary(sheet, items, subjectPlural, {
    totalCount: totalPatients,
    totalFacturadoBs,
  });
}
