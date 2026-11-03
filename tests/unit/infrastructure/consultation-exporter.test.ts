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

    expect(cellValues).toContain('CÁLCULO DE EXONERADOS Y TOTALES (COMPROMISO CONGREGACIÓN)');
    expect(cellValues).toContain('TOTAL A PAGAR POR LA CONGREGACIÓN');
    expect(cellValues).toContain('CONSOLIDADO GENERAL: INGRESOS DIRECTOS VS. APORTE CONGREGACIÓN');
    expect(cellValues).toContain('Exonerado 100%');
  });
});
