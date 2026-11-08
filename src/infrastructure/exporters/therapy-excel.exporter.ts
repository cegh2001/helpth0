import ExcelJS from 'exceljs';
import { TherapySession } from '@/core/domain/entities/therapy-session.entity';
import { TherapyExporterPort } from '@/core/application/ports/therapy-exporter.port';
import { appendStandardExcelSummary } from './standard-excel-summary.builder';
import { formatDisplayDate } from '@/lib/date-utils';

export { type TherapyExporterPort };
export type TherapyExcelExporter = TherapyExporterPort;

interface SpecialtyAggregate {
  sessions: number;
  totalBs: number;
  referenceUsd: number;
}

interface TherapistAggregate {
  sessions: number;
  totalBs: number;
  specialtyCounts: Map<string, number>;
}

function aggregateBySpecialty(sessions: TherapySession[]): Map<string, SpecialtyAggregate> {
  const map = new Map<string, SpecialtyAggregate>();

  for (const session of sessions) {
    const current = map.get(session.specialty) ?? {
      sessions: 0,
      totalBs: 0,
      referenceUsd: session.amountUsd,
    };
    current.sessions++;
    current.totalBs += session.totalBs;
    if (session.amountUsd > 0) current.referenceUsd = session.amountUsd;
    map.set(session.specialty, current);
  }

  return map;
}

function aggregateByTherapist(sessions: TherapySession[]): Map<string, TherapistAggregate> {
  const map = new Map<string, TherapistAggregate>();

  for (const session of sessions) {
    const current = map.get(session.therapistName) ?? {
      sessions: 0,
      totalBs: 0,
      specialtyCounts: new Map<string, number>(),
    };
    current.sessions++;
    current.totalBs += session.totalBs;
    current.specialtyCounts.set(
      session.specialty,
      (current.specialtyCounts.get(session.specialty) ?? 0) + 1
    );
    map.set(session.therapistName, current);
  }

  return map;
}

function mainSpecialty(aggregate: TherapistAggregate): string {
  let winner = '';
  let best = -1;

  for (const [specialty, count] of aggregate.specialtyCounts.entries()) {
    if (count > best) {
      winner = specialty;
      best = count;
    }
  }

  return winner;
}

function applyMoneyFormat(row: ExcelJS.Row, columns: number[]): void {
  for (const columnIndex of columns) {
    const cell = row.getCell(columnIndex);
    if (typeof cell.value === 'number') {
      cell.numFmt = '#,##0.00';
    }
  }
}

export class ExcelJsTherapyExporter implements TherapyExcelExporter {
  async exportToExcel(
    sessions: TherapySession[],
    titlePeriod = 'HISTÓRICO COMPLETO'
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'helpth0';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Control de Terapias', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { key: 'index', width: 6 },
      { key: 'date', width: 13 },
      { key: 'therapist', width: 28 },
      { key: 'specialty', width: 24 },
      { key: 'day', width: 14 },
      { key: 'pointBs', width: 14 },
      { key: 'mobileBs', width: 14 },
      { key: 'cashBs', width: 14 },
      { key: 'bcvRate', width: 13 },
      { key: 'usd', width: 11 },
      { key: 'totalBs', width: 15 },
      { key: 'observations', width: 28 },
    ];

    const headerRow = sheet.addRow([
      '#',
      'Fecha',
      'Terapeuta',
      'Especialidad',
      'Dia',
      'Punto',
      'Pago Movil',
      'Efectivo',
      'Tasa BCV',
      'Divisas',
      'TOTAL',
      'Observaciones',
    ]);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' }, // Teal
    };
    headerRow.height = 24;

    sessions.forEach((session) => {
      const row = sheet.addRow([
        session.sessionIndex,
        formatDisplayDate(session.date),
        session.therapistName,
        session.specialty,
        session.dayOfWeekName,
        session.amountPointBs > 0 ? session.amountPointBs : '',
        session.amountMobileBs > 0 ? session.amountMobileBs : '',
        session.amountCashBs > 0 ? session.amountCashBs : '',
        session.bcvRate > 0 ? session.bcvRate : '',
        session.amountUsd > 0 ? session.amountUsd : '',
        session.totalBs > 0 ? session.totalBs : '',
        session.observations ?? session.status,
      ]);

      row.alignment = { vertical: 'middle' };
      applyMoneyFormat(row, [6, 7, 8, 9, 10, 11]);
    });

    sheet.addRow([]);

    this.appendSpecialtySummary(sheet, sessions, titlePeriod);
    this.appendTherapistSummary(sheet, sessions, titlePeriod);

    appendStandardExcelSummary(
      sheet,
      sessions,
      'TERAPIAS Y REHABILITACIÓN',
      titlePeriod,
      'Sesiones'
    );

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private appendSpecialtySummary(
    sheet: ExcelJS.Worksheet,
    sessions: TherapySession[],
    titlePeriod: string
  ): void {
    const title = sheet.addRow([
      '',
      `RESUMEN CONSOLIDADO DE TERAPIAS - ${titlePeriod.toUpperCase()}`,
    ]);
    title.font = { bold: true, size: 12, color: { argb: 'FF0F766E' } };

    const header = sheet.addRow([
      '',
      'Especialidad',
      'Pacientes / Sesiones',
      'Tarifa Ref. ($)',
      'Total Facturado (Bs)',
      '% Participación',
    ]);
    header.font = { bold: true };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

    const bySpecialty = aggregateBySpecialty(sessions);
    const totalSessions = sessions.length;
    let grandTotalBs = 0;

    for (const [specialty, data] of bySpecialty.entries()) {
      grandTotalBs += data.totalBs;
      const percent = totalSessions > 0 ? ((data.sessions / totalSessions) * 100).toFixed(2) : '0.00';
      const row = sheet.addRow([
        '',
        specialty,
        data.sessions,
        data.referenceUsd,
        data.totalBs,
        `${percent}%`,
      ]);
      applyMoneyFormat(row, [4, 5]);
    }

    const totalRow = sheet.addRow([
      '',
      'TOTAL TERAPIAS',
      totalSessions,
      '',
      grandTotalBs,
      '100.00%',
    ]);
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    applyMoneyFormat(totalRow, [5]);

    sheet.addRow([]);
    sheet.addRow([]);
  }

  private appendTherapistSummary(
    sheet: ExcelJS.Worksheet,
    sessions: TherapySession[],
    titlePeriod: string
  ): void {
    const title = sheet.addRow([
      '',
      `DISTRIBUCIÓN POR PROFESIONAL / TERAPEUTA - ${titlePeriod.toUpperCase()}`,
    ]);
    title.font = { bold: true, size: 12, color: { argb: 'FF0F766E' } };

    const header = sheet.addRow([
      '',
      'Terapeuta',
      'Especialidad Principal',
      'Sesiones Atendidas',
      'Total Facturado (Bs)',
      '% Sesiones',
    ]);
    header.font = { bold: true };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

    const byTherapist = aggregateByTherapist(sessions);
    const totalSessions = sessions.length;
    let grandTotalBs = 0;

    for (const [therapist, data] of byTherapist.entries()) {
      grandTotalBs += data.totalBs;
      const percent = totalSessions > 0 ? ((data.sessions / totalSessions) * 100).toFixed(2) : '0.00';
      const row = sheet.addRow([
        '',
        therapist,
        mainSpecialty(data),
        data.sessions,
        data.totalBs,
        `${percent}%`,
      ]);
      applyMoneyFormat(row, [5]);
    }

    const totalRow = sheet.addRow([
      '',
      'TOTAL PROFESIONALES',
      '',
      totalSessions,
      grandTotalBs,
      '100.00%',
    ]);
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    applyMoneyFormat(totalRow, [5]);
  }
}
