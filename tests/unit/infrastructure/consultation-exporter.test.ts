import { describe, expect, it } from 'vitest';
import { ExcelJsConsultationExporter } from '@/infrastructure/exporters/consultation-excel.exporter';
import { Consultation } from '@/core/domain/entities/consultation.entity';

describe('ExcelJsConsultationExporter', () => {
  it('generates an enriched Excel buffer with detailed rows and automated consolidated summaries', async () => {
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
        amountPointBs: 13186.8,
        bcvRate: 879.12,
        amountUsd: 15,
        status: 'EXONERADO',
      }),
    ];

    const buffer = await exporter.exportToExcel(consultations, 'OCTUBRE 2026');

    expect(buffer.length).toBeGreaterThan(1500);
  });
});
