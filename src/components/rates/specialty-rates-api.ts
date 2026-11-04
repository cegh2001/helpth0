import { requestJson } from '@/lib/api-client';
import { SpecialtyRateItem } from './specialty-rates-item';

export interface RatesApiResponse {
  success: boolean;
  data: {
    defaultRateUsd: number;
    rates: SpecialtyRateItem[];
  };
}

export interface SaveRateApiResponse {
  success: boolean;
  data: SpecialtyRateItem;
}

export async function fetchSpecialtyRates(): Promise<{
  defaultRateUsd: number;
  rates: SpecialtyRateItem[];
}> {
  const res = await requestJson<RatesApiResponse>(
    '/api/specialty-rates',
    undefined,
    'No se pudieron cargar las tarifas'
  );
  return res.data;
}

export async function saveSpecialtyRateApi(input: {
  id?: string;
  specialty: string;
  standardRateUsd: number;
}): Promise<SpecialtyRateItem> {
  const res = await requestJson<SaveRateApiResponse>(
    '/api/specialty-rates',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    'No se pudo guardar la tarifa'
  );
  return res.data;
}

export async function deleteSpecialtyRateApi(id: string): Promise<void> {
  await requestJson<{ success: boolean }>(
    `/api/specialty-rates?id=${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    'No se pudo eliminar la tarifa'
  );
}
