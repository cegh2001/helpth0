import { Edit2, Trash2 } from 'lucide-react';
import { SpecialtyRateItem } from './specialty-rates-item';

interface SpecialtyRatesTableProps {
  rates: SpecialtyRateItem[];
  onEdit: (item: SpecialtyRateItem) => void;
  onDelete: (id: string, name: string) => void;
}

export function SpecialtyRatesTable({
  rates,
  onEdit,
  onDelete,
}: SpecialtyRatesTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">
          Tarifas Personalizadas ({rates.length})
        </h2>
        <span className="text-xs text-slate-400">
          Valores de referencia para cálculo de exoneraciones
        </span>
      </div>

      {rates.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No hay tarifas personalizadas registradas. Todas aplican la tarifa base ($10.00).
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">Especialidad</th>
                <th className="px-5 py-3 font-semibold text-right">Tarifa de Referencia</th>
                <th className="px-5 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {r.specialty}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                    ${r.standardRateUsd.toFixed(2)} USD
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Editar tarifa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id, r.specialty)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar tarifa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
