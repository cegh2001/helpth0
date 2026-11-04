'use client';

import { useState } from 'react';
import {
  BadgeDollarSign,
  Plus,
  Info,
  Check,
  X,
} from 'lucide-react';
import { SpecialtyRateItem } from './specialty-rates-item';
import {
  saveSpecialtyRateApi,
  deleteSpecialtyRateApi,
} from './specialty-rates-api';
import { SpecialtyRatesTable } from './specialty-rates-table';
import { notifySuccess, notifyError } from '@/components/dashboard/notify';

interface SpecialtyRatesPageProps {
  initialDefaultRateUsd: number;
  initialRates: SpecialtyRateItem[];
}

export function SpecialtyRatesPage({
  initialDefaultRateUsd,
  initialRates,
}: SpecialtyRatesPageProps) {
  const [rates, setRates] = useState<SpecialtyRateItem[]>(initialRates);
  const [specialty, setSpecialty] = useState('');
  const [rateUsd, setRateUsd] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartEdit = (item: SpecialtyRateItem) => {
    setEditingId(item.id);
    setSpecialty(item.specialty);
    setRateUsd(item.standardRateUsd);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSpecialty('');
    setRateUsd('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialty.trim() || rateUsd === '' || rateUsd < 0) {
      notifyError('Completá la especialidad y una tarifa válida', 'Error de validación');
      return;
    }

    try {
      setIsSubmitting(true);
      const saved = await saveSpecialtyRateApi({
        id: editingId ?? undefined,
        specialty: specialty.trim(),
        standardRateUsd: Number(rateUsd),
      });

      setRates((prev) => {
        const index = prev.findIndex(
          (r) => r.id === saved.id || r.specialty.toLowerCase() === saved.specialty.toLowerCase()
        );
        if (index >= 0) {
          const next = [...prev];
          next[index] = saved;
          return next;
        }
        return [...prev, saved].sort((a, b) => a.specialty.localeCompare(b.specialty));
      });

      notifySuccess(
        editingId ? 'Tarifa actualizada correctamente' : 'Nueva tarifa registrada'
      );
      handleCancelEdit();
    } catch (err) {
      notifyError(err, 'No se pudo guardar la tarifa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la tarifa configurada para ${name}? Volverá a la tarifa por defecto.`)) {
      return;
    }

    try {
      await deleteSpecialtyRateApi(id);
      setRates((prev) => prev.filter((r) => r.id !== id));
      notifySuccess(`Tarifa de ${name} eliminada`);
      if (editingId === id) handleCancelEdit();
    } catch (err) {
      notifyError(err, 'No se pudo eliminar la tarifa');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <BadgeDollarSign className="w-6 h-6 text-amber-600" aria-hidden="true" />
          Tarifas de Referencia y Exoneración
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configuración de costos de referencia para el cálculo de atenciones exoneradas asumidas por la Congregación.
        </p>
      </div>

      {/* Default Banner Card */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 md:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-amber-950">
            Tarifa Base General por Defecto: ${initialDefaultRateUsd.toFixed(2)} USD
          </p>
          <p className="text-amber-800/90 mt-0.5">
            Cualquier especialidad médica que no esté listada en esta tabla tomará automáticamente esta tarifa ($10.00) cuando un paciente venga exonerado y el archivo no traiga monto explícito.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          {editingId ? 'Editar Tarifa de Especialidad' : 'Fijar Tarifa Específica'}
        </h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6 space-y-1">
            <label htmlFor="specialty-input" className="text-xs font-semibold text-slate-700">
              Especialidad
            </label>
            <input
              id="specialty-input"
              type="text"
              placeholder="ej. Psicologia"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label htmlFor="rate-input" className="text-xs font-semibold text-slate-700">
              Tarifa Ref. ($ USD)
            </label>
            <input
              id="rate-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="15.00"
              value={rateUsd}
              onChange={(e) => setRateUsd(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors"
            />
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingId ? 'Actualizar' : 'Guardar Tarifa'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Cancelar edición"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table Section */}
      <SpecialtyRatesTable
        rates={rates}
        onEdit={handleStartEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
