'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Stethoscope, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { notifyError } from '@/components/dashboard/notify';
import { useUrlState } from '@/components/dashboard/use-url-state';
import { ReportsTab } from '@/components/reports/reports-tab';
import { formatLocalDate, getCurrentTimeString, getDoctorDutyStatus } from '@/lib/date-utils';
import { joinUrl, setSearchParam } from '@/lib/search-params';
import { WEEKDAY_NAMES } from '@/lib/weekday-names';
import { filterDoctorsByQuery, type DailyOverviewData } from './daily-overview';
import { DoctorCountCard } from './doctor-count-card';
import { ReceptionDateNavigator } from './reception-date-navigator';
import { ReceptionSummaryCards } from './reception-summary-cards';
import { useDailyOverview } from './use-daily-overview';

export function ReceptionPage({
  initialDate,
  initialQuery,
  initialOverview,
}: {
  initialDate: string;
  initialQuery: string;
  initialOverview: DailyOverviewData;
}) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentTime, setCurrentTime] = useState<string>(() => getCurrentTimeString());
  const [search, setSearch] = useUrlState('q', initialQuery);

  const handleOverviewError = useCallback((error: unknown) => {
    notifyError(error, 'Error al guardar el conteo', { id: 'reception-count' });
  }, []);

  const { overview, updateCount } = useDailyOverview(initialOverview, handleOverviewError);

  const isToday = selectedDate === formatLocalDate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCurrentTimeString()), 30000);
    return () => clearInterval(timer);
  }, []);

  const doctors = useMemo(() => overview.doctors, [overview]);
  const activeNowCount = doctors.filter(
    (doctor) => getDoctorDutyStatus(doctor.schedules, isToday, currentTime) === 'on_duty'
  ).length;
  const scheduledTodayCount = doctors.filter((doctor) => doctor.scheduledToday).length;
  const visibleDoctors = filterDoctorsByQuery(doctors, search);

  // The day lives in the URL and is rendered on the server: changing it is a
  // navigation, not a local refetch.
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    startNavigation(() => {
      const query = setSearchParam(
        window.location.search,
        'date',
        date,
        formatLocalDate()
      );
      router.replace(joinUrl(window.location.pathname, query), { scroll: false });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Recepción Diaria</h1>
          <p className="text-xs text-slate-500">
            Conteo para el {WEEKDAY_NAMES[overview.dayOfWeek]}, {selectedDate}
          </p>
        </div>
        <ReceptionDateNavigator value={selectedDate} onChange={handleDateChange} />
      </div>

      <ReceptionSummaryCards
        loading={isNavigating}
        overview={overview}
        activeNowCount={activeNowCount}
        scheduledTodayCount={scheduledTodayCount}
        isToday={isToday}
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Conteo por Médico</h2>
            <p className="text-xs text-slate-500">
              Registrá el número de pacientes atendidos por cada médico durante su consulta.
            </p>
          </div>

          {doctors.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                type="text"
                aria-label="Buscar médico o especialidad en recepción"
                placeholder="Buscar médico o especialidad..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9 pr-8 h-9 text-xs rounded-xl bg-white shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Limpiar búsqueda de recepción"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {isNavigating ? (
          <div className="py-16 text-center text-slate-400">Cargando datos del día...</div>
        ) : doctors.length === 0 ? (
          <Card className="border-dashed p-12 text-center space-y-4 bg-white">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" aria-hidden="true" />
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                No hay médicos registrados aún
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Ingresá en la sección de Médicos y Horarios para agregar al personal y configurar
                sus turnos.
              </p>
            </div>
            <Button asChild className="rounded-xl shadow-xs cursor-pointer">
              <Link href="/medicos">
                <UserPlus className="w-4 h-4 mr-2" />
                Agregar Primer Médico
              </Link>
            </Button>
          </Card>
        ) : visibleDoctors.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
            <p className="text-sm font-medium">
              No se encontraron médicos que coincidan con &ldquo;{search}&rdquo;
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch('')}
              className="cursor-pointer text-xs rounded-xl"
            >
              Limpiar búsqueda
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleDoctors.map((doctor) => (
              <DoctorCountCard
                key={doctor.doctorId}
                doctor={doctor}
                isToday={isToday}
                currentTime={currentTime}
                onCountChange={updateCount}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pt-4">
        <ReportsTab />
      </div>
    </div>
  );
}
