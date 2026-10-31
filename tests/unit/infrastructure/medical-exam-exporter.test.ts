import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { ExcelJsMedicalExamExporter } from '@/infrastructure/exporters/medical-exam-excel.exporter';
import { MedicalExam } from '@/core/domain/entities/medical-exam.entity';

describe('ExcelJsMedicalExamExporter', () => {
  it('generates an enriched Excel buffer with detailed rows and automated consolidated summaries', async () => {
    const exporter = new ExcelJsMedicalExamExporter();
    const exams = [
      MedicalExam.create({
        date: '2026-09-28',
        patientName: 'Zoraida Fernandez',
        patientCedula: '11639560',
        patientBirthDate: '1973-03-28',
        patientAddress: 'Caraballeda',
        patientPhone: '4149211060',
        examName: null,
        amountPointBs: 37067.41,
        bcvRate: 857.05,
        amountUsd: 86.5,
        status: 'EXONERADO 50%',
        observations: 'EXONERADO 50%',
      }),
      MedicalExam.create({
        date: '2026-09-29',
        patientName: 'Yoennifer Hernandez',
        patientCedula: '33262145',
        patientBirthDate: '2010-04-24',
        patientAddress: 'Caraballeda',
        patientPhone: '4126284702',
        examName: null,
        amountMobileBs: 53188.56,
        bcvRate: 857.88,
        amountUsd: 62,
        status: 'COMPLETO',
      }),
    ];

    const buffer = await exporter.exportToExcel(exams, 'SEPT/OCT 2026');
    expect(buffer.length).toBeGreaterThan(100);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('Control de Exámenes');
    expect(sheet).not.toBeUndefined();
    expect(sheet!.rowCount).toBeGreaterThan(10);
  });
});
