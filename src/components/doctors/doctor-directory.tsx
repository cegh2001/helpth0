'use client';

import { CalendarDays, Pencil, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { DoctorListItem } from './doctor-list-item';

interface DoctorDirectoryProps {
  doctors: DoctorListItem[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (doctor: DoctorListItem) => void;
  onManageSchedules: (doctor: DoctorListItem) => void;
  onDeactivate: (doctor: DoctorListItem) => void;
}

export function DoctorDirectory({
  doctors,
  isLoading,
  search,
  onSearchChange,
  onEdit,
  onManageSchedules,
  onDeactivate,
}: DoctorDirectoryProps) {
  const visibleDoctors = (() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return doctors;
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(needle) ||
        doctor.specialty.toLowerCase().includes(needle)
    );
  })();

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-bold text-slate-900 text-base">Personal Médico del Consultorio</h2>

        {doctors.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              type="text"
              aria-label="Buscar médico por nombre o especialidad"
              placeholder="Buscar por nombre o área..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-white shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Limpiar búsqueda de médicos"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-slate-400 border-dashed bg-white">
          Cargando personal médico...
        </Card>
      ) : doctors.length === 0 ? (
        <Card className="p-8 text-center text-slate-400 border-dashed bg-white">
          No hay médicos registrados. Agregá uno usando el formulario.
        </Card>
      ) : visibleDoctors.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <Search className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
          <p className="text-sm font-medium">
            No se encontraron médicos para &ldquo;{search}&rdquo;
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSearchChange('')}
            className="cursor-pointer text-xs rounded-xl"
          >
            Limpiar búsqueda
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleDoctors.map((doctor) => (
            <Card
              key={doctor.id}
              className="shadow-xs border-slate-200 hover:border-slate-300 transition bg-white"
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{doctor.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{doctor.specialty}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(doctor)}
                    title="Editar datos del médico"
                    className="rounded-xl text-xs cursor-pointer hover:bg-slate-100 transition"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1 text-slate-600" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageSchedules(doctor)}
                    className="rounded-xl text-xs cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    Turnos
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDeactivate(doctor)}
                    title="Desactivar médico"
                    aria-label={`Desactivar a ${doctor.name}`}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer rounded-xl h-8 w-8 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
