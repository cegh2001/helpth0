'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Stethoscope, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FeedbackBanner } from '@/components/dashboard/feedback-banner';
import { useFeedback } from '@/components/dashboard/use-feedback';
import { useUrlState } from '@/components/dashboard/use-url-state';
import { ReportsTab } from '@/components/reports/reports-tab';
import { formatLocalDate, getCurrentTimeString, getDoctorDutyStatus } from '@/lib/date-utils';
import { WEEKDAY_NAMES } from '@/lib/weekday-names';
import { filterDoctorsByQuery } from './daily-overview';
import { DoctorCountCard } from './doctor-count-card';
import { ReceptionDateNavigator } from './reception-date-navigator';
import { ReceptionSummaryCards } from './reception-summary-cards';
import { useDailyOverview } from './use-daily-overview';

export function ReceptionPage({
  initialDate,
  initialQuery,
}: {
  initialDate: string;
  initialQuery: string;
}) {
  const [selectedDate, setSelectedDate] = useUrlState('date', initialDate, formatLocalDate());
  const [currentTime, setCurrentTime] = useState<string>(() => getCurrentTimeString());
  const [search, setSearch] = useUrlState('q', initialQuery);
  const { feedback, showError, dismissFeedback } = useFeedback();

  const { overview, loading, markLoading, updateCount } = useDailyOverview({
    date: selectedDate,
    onError: showError,
  });

  const isToday = selectedDate === formatLocalDate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCurrentTimeString()), 30000);
    return () => clearInterval(timer);
  }, []);

  const doctors = useMemo(() => overview?.doctors ?? [], [overview]);
  const activeNowCount = doctors.filter(
    (doctor) => getDoctorDutyStatus(doctor.schedules, isToday, currentTime) === 'on_duty'
  ).length;
  const scheduledTodayCount = doctors.filter((doctor) => doctor.scheduledToday).length;
  const visibleDoctors = filterDoctorsByQuery(doctors, search);

  const handleDateChange = (date: string) => {
    markLoading();
    setSelectedDate(date);
  };

  return (
    <div className="space-y-6">
      {feedback && <FeedbackBanner message={feedback} onDismiss={dismissFeedback} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Recepción Diaria</h1>
          <p className="text-xs text-slate-500">
            Conteo para el {WEEKDAY_NAMES[overview?.dayOfWeek ?? 0]}, {selectedDate}
          </p>
        </div>
        <ReceptionDateNavigator value={selectedDate} onChange={handleDateChange} />
      </div>

      <ReceptionSummaryCards
        loading={loading}
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

        {loading ? (
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
