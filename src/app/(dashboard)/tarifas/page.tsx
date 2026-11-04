import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getSpecialtyRatesUseCase } from '@/infrastructure/container';
import { SpecialtyRatesPage } from '@/components/rates/specialty-rates-page';
import { toSpecialtyRateItems } from '@/components/rates/specialty-rates-item';

export const metadata: Metadata = {
  title: 'Tarifas y Exoneración',
};

export default async function SpecialtyRatesRoute() {
  await connection();
  const result = await getSpecialtyRatesUseCase.execute();

  return (
    <SpecialtyRatesPage
      initialDefaultRateUsd={result.defaultRateUsd}
      initialRates={toSpecialtyRateItems(result.rates)}
    />
  );
}
