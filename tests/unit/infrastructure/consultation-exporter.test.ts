import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { ExcelJsConsultationExporter } from '@/infrastructure/exporters/consultation-excel.exporter';
import { Consultation } from '@/core/domain/entities/consultation.entity';

describe('ExcelJsConsultationExporter', () => {
  it('generates an enriched Excel buffer with detailed rows, automated consolidated summaries, and exoneration calculations', async () => {
    const exporter = new ExcelJsConsultationExporter();
    const consultations = [
      Consultation.create({
        date: '2026-10-01',
        patientName: 'Leonardo Bolivar',
        patientCedula: '7996174',
        patientAddress: 'Caraballeda',
        patientPhone: '4127109167',
        doctorName: 'Dra Mailet Contrera',
        specialty: 'Traumatologia',
        amountPointBs: 4300.85,
        bcvRate: 860.17,
        amountUsd: 5,
        status: 'COMPLETO',
      }),
      Consultation.create({
        date: '2026-10-01',
        patientName: 'Maria Desousa',
        patientCedula: '5963322',
        patientAddress: 'Caraballeda',
        patientPhone: '4242935993',
        doctorName: 'Dra Neyda Castillo',
        specialty: 'Medicina Interna',
        amountPointBs: 4300.85,
        bcvRate: 860.17,
        amountUsd: 5,
        status: 'COMPLETO',
      }),
      Consultation.create({
        date: '2026-10-15',
        patientName: 'Simon Lopez',
        patientCedula: '4561810',
        patientAddress: 'Caraballeda',
        patientPhone: '4125999541',
        doctorName: 'Lic Maria Jose De Sousa',
        specialty: 'Psicologia',
        amountPointBs: 0,
        bcvRate: 879.12,
        amountUsd: 15,
        status: 'EXONERADO 100%',
        exonerationPercent: 100,
        exoneratedAmountUsd: 15,
      }),
    ];

    const buffer = await exporter.exportToExcel(consultations, 'OCTUBRE 2026');

    expect(buffer.length).toBeGreaterThan(1500);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('Consultas y Pagos');

    const cellValues: string[] = [];
    sheet?.eachRow((row) => {
      (row.values as unknown[]).forEach((val) => {
        if (typeof val === 'string') cellValues.push(val);
      });
    });

    expect(sheet?.getRow(2).getCell(2).value).toBe('01/10/2026');
    expect(sheet?.getRow(4).getCell(2).value).toBe('15/10/2026');
    expect(sheet?.getColumn(2).width).toBeGreaterThanOrEqual(38);
    expect(cellValues).toContain('Tarifa Base ($)');
    expect(cellValues).toContain('CÁLCULO DE EXONERADOS Y TOTALES (COMPROMISO CONGREGACIÓN)');
    expect(cellValues).toContain('TOTAL A PAGAR POR LA CONGREGACIÓN');
    expect(cellValues).toContain('CONSOLIDADO GENERAL: INGRESOS DIRECTOS VS. APORTE CONGREGACIÓN');
    expect(cellValues).toContain('Exonerado 100%');
    expect(cellValues).toContain('Aporte Fijo Congregación ($10)');
    expect(cellValues).toContain('CONTROL DE PAGOS: 100% SOLVENTE');
    expect(cellValues).not.toContain('CLASIFICACIÓN POR ESTATUS Y CONDICIÓN DE PAGO');
  });

  it('renders pending payments alert section when pending consultations exist', async () => {
    const exporter = new ExcelJsConsultationExporter();
    const consultations = [
      Consultation.create({
        date: '2026-10-20',
        patientName: 'Rosmery Sanchez',
        doctorName: 'Dr Deiby Chirinos',
        specialty: 'Neumonologia',
        amountPointBs: 0,
        bcvRate: 860,
        amountUsd: 5,
        status: 'PENDIENTE',
        observations: 'PENDIENTE DE PAGO',
      }),
    ];

    const buffer = await exporter.exportToExcel(consultations, 'OCTUBRE 2026');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('Consultas y Pagos');

    const cellValues: string[] = [];
    sheet?.eachRow((row) => {
      (row.values as unknown[]).forEach((val) => {
        if (typeof val === 'string') cellValues.push(val);
      });
    });

    expect(sheet?.getRow(2).getCell(2).value).toBe('20/10/2026');
    expect(cellValues).toContain('DETALLE DE CASOS PENDIENTES DE PAGO EN EL PERÍODO');
    expect(cellValues).toContain('Rosmery Sanchez');
    expect(cellValues).toContain('TOTAL CASOS PENDIENTES');
  });
});
