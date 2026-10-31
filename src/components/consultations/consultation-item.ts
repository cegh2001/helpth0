import type { Consultation } from '@/core/domain/entities/consultation.entity';

export interface ConsultationItem {
  id: string;
  date: string;
  patientName: string;
  patientCedula: string | null;
  patientPhone: string | null;
  patientAddress: string | null;
  doctorName: string;
  specialty: string;
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
 * no ids the table does not use, no timestamps.
 */
export function toConsultationItems(consultations: Consultation[]): ConsultationItem[] {
  return consultations.map((consultation) => ({
    id: consultation.id,
    date: consultation.date,
    patientName: consultation.patientName,
    patientCedula: consultation.patientCedula,
    patientPhone: consultation.patientPhone,
    patientAddress: consultation.patientAddress,
    doctorName: consultation.doctorName,
    specialty: consultation.specialty,
    amountPointBs: consultation.amountPointBs,
    amountMobileBs: consultation.amountMobileBs,
    amountCashBs: consultation.amountCashBs,
    bcvRate: consultation.bcvRate,
    amountUsd: consultation.amountUsd,
    totalBs: consultation.totalBs,
    status: consultation.status,
    exonerationPercent: consultation.exonerationPercent,
    exoneratedAmountUsd: consultation.exoneratedAmountUsd,
    observations: consultation.observations,
  }));
}
