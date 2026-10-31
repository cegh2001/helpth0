import type { MedicalExam } from '@/core/domain/entities/medical-exam.entity';

export interface MedicalExamItem {
  id: string;
  date: string;
  patientName: string;
  patientCedula: string | null;
  patientBirthDate: string | null;
  patientPhone: string | null;
  patientAddress: string | null;
  examName: string | null;
  amountPointBs: number;
  amountMobileBs: number;
  amountCashBs: number;
  bcvRate: number;
  amountUsd: number;
  totalBs: number;
  status: string;
  exonerationPercent: number;
  exoneratedAmountUsd: number;
  observations: string | null;
}

/**
 * Domain entities cannot cross the server/client boundary, and the client only
 * needs the columns it renders. This is the delivery view model: no importHash,
 * no timestamps.
 */
export function toMedicalExamItems(exams: MedicalExam[]): MedicalExamItem[] {
  return exams.map((exam) => ({
    id: exam.id,
    date: exam.date,
    patientName: exam.patientName,
    patientCedula: exam.patientCedula,
    patientBirthDate: exam.patientBirthDate,
    patientPhone: exam.patientPhone,
    patientAddress: exam.patientAddress,
    examName: exam.examName,
    amountPointBs: exam.amountPointBs,
    amountMobileBs: exam.amountMobileBs,
    amountCashBs: exam.amountCashBs,
    bcvRate: exam.bcvRate,
    amountUsd: exam.amountUsd,
    totalBs: exam.totalBs,
    status: exam.status,
    exonerationPercent: exam.exonerationPercent,
    exoneratedAmountUsd: exam.exoneratedAmountUsd,
    observations: exam.observations,
  }));
}
