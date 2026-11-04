import ExcelJS from 'exceljs';
import {
  aggregateExonerations,
  ExonerationRowItem,
} from './exoneration-summary.aggregator';

export {
  type ExonerationRowItem,
  parseExonerationTier,
  aggregateExonerations,
} from './exoneration-summary.aggregator';

export function appendExonerationExcelSummary(
  sheet: ExcelJS.Worksheet,
  items: ExonerationRowItem[],
  subjectPlural: string,
  totals: { totalCount: number; totalFacturadoBs: number }
): void {
  sheet.addRow([]);
  sheet.addRow([]);

  const summary = aggregateExonerations(items);

  // 1. Header Section
  const titleRow = sheet.addRow([
    '',
    'CÁLCULO DE EXONERADOS Y TOTALES (COMPROMISO CONGREGACIÓN)',
  ]);
  titleRow.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };

  const subtitleRow = sheet.addRow([
    '',
    'Detalle de atenciones exoneradas y montos asumidos a cubrir por la Congregación',
  ]);
  subtitleRow.font = { italic: true, size: 9, color: { argb: 'FF475569' } };

  const colsRow = sheet.addRow([
    '',
    'Condición de Exoneración',
    `${subjectPlural} Exonerados`,
    'Tarifa Base Ref. ($)',
    'Total Exonerado ($)',
    'Total Exonerado (Bs)',
    '% del Total Casos',
  ]);
  colsRow.font = { bold: true };
  colsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFEF3C7' },
  };

  if (summary.tiers.length === 0) {
    sheet.addRow(['', 'Sin casos exonerados registrados en este período', 0, '', '', '', '0.0%']);
  } else {
    for (const tier of summary.tiers) {
      const pct = totals.totalCount > 0
        ? `${((tier.count / totals.totalCount) * 100).toFixed(1)}%`
        : '0.0%';
      const row = sheet.addRow([
        '',
        tier.tierLabel,
        tier.count,
        tier.baseUsd > 0 ? tier.baseUsd : '',
        tier.exoneratedUsd > 0 ? tier.exoneratedUsd : '',
        tier.exoneratedBs > 0 ? tier.exoneratedBs : '',
        pct,
      ]);
      [4, 5, 6].forEach((cIdx) => {
        const cell = row.getCell(cIdx);
        if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
      });
    }
  }

  const exonTotalPct = totals.totalCount > 0
    ? `${((summary.totalExonCount / totals.totalCount) * 100).toFixed(1)}%`
    : '0.0%';

  const totalRow = sheet.addRow([
    '',
    'TOTAL A PAGAR POR LA CONGREGACIÓN',
    summary.totalExonCount,
    summary.totalExonBaseUsd,
    summary.totalExonUsd,
    summary.totalExonBs,
    exonTotalPct,
  ]);
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFDE68A' },
  };
  [4, 5, 6].forEach((cIdx) => {
    const cell = totalRow.getCell(cIdx);
    if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
  });

  sheet.addRow([]);

  // 2. Consolidated Balance Matrix
  const balanceCols = sheet.addRow([
    '',
    'CONSOLIDADO GENERAL: INGRESOS DIRECTOS VS. APORTE CONGREGACIÓN',
    `${subjectPlural}`,
    'Monto Divisas ($)',
    'Monto Bolívares (Bs)',
    '% del Valor Total',
  ]);
  balanceCols.font = { bold: true };
  balanceCols.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  const directPatients = items.filter(
    (i) =>
      (i.amountPointBs + i.amountMobileBs + i.amountCashBs) > 0 ||
      (i.amountUsd > 0 && i.exonerationPercent !== 100 && !i.status?.toUpperCase().includes('100%'))
  ).length;

  const directPatientsCount = directPatients > 0
    ? directPatients
    : Math.max(0, totals.totalCount - summary.totalExonCount);

  const directUsd = items.reduce((sum, i) => {
    if (i.exonerationPercent === 100 || i.status?.toUpperCase().includes('100%')) return sum;
    return sum + (i.amountUsd > 0 ? i.amountUsd : 0);
  }, 0);

  const totalServiceBs = totals.totalFacturadoBs + summary.totalExonBs;
  const totalServiceUsd = directUsd + summary.totalExonUsd;

  const directPct = totalServiceBs > 0
    ? `${((totals.totalFacturadoBs / totalServiceBs) * 100).toFixed(1)}%`
    : '0.0%';
  const exonPct = totalServiceBs > 0
    ? `${((summary.totalExonBs / totalServiceBs) * 100).toFixed(1)}%`
    : '0.0%';

  const directRow = sheet.addRow([
    '',
    `Cobrado Directamente en Caja (${subjectPlural})`,
    directPatientsCount,
    directUsd > 0 ? directUsd : '',
    totals.totalFacturadoBs,
    directPct,
  ]);
  [4, 5].forEach((cIdx) => {
    const cell = directRow.getCell(cIdx);
    if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
  });

  const exonRow = sheet.addRow([
    '',
    'Aporte Asumido por la Congregación (Exonerados)',
    summary.totalExonCount,
    summary.totalExonUsd,
    summary.totalExonBs,
    exonPct,
  ]);
  [4, 5].forEach((cIdx) => {
    const cell = exonRow.getCell(cIdx);
    if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
  });

  const grandTotalRow = sheet.addRow([
    '',
    'VALOR TOTAL DEL SERVICIO PRESTADO',
    totals.totalCount,
    totalServiceUsd > 0 ? totalServiceUsd : summary.totalExonUsd,
    totalServiceBs,
    '100.0%',
  ]);
  grandTotalRow.font = { bold: true };
  grandTotalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCBD5E1' },
  };
  [4, 5].forEach((cIdx) => {
    const cell = grandTotalRow.getCell(cIdx);
    if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
  });
}
