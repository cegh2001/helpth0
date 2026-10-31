import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { addDaysToDateString, formatLocalDate } from '@/lib/date-utils';

interface ReceptionDateNavigatorProps {
  value: string;
  onChange: (date: string) => void;
}

export function ReceptionDateNavigator({ value, onChange }: ReceptionDateNavigatorProps) {
  return (
    <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(addDaysToDateString(value, -1))}
        title="Día Anterior"
        aria-label="Ver el día anterior"
        className="cursor-pointer hover:bg-white hover:shadow-2xs rounded-lg"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <DatePicker
        value={value}
        onChange={onChange}
        ariaLabel="Seleccionar fecha del conteo"
        className="border-0 bg-transparent shadow-none hover:bg-white h-8 text-xs font-semibold"
      />

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(addDaysToDateString(value, 1))}
        title="Día Siguiente"
        aria-label="Ver el día siguiente"
        className="cursor-pointer hover:bg-white hover:shadow-2xs rounded-lg"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(formatLocalDate())}
        className="text-xs font-semibold h-8 px-3 rounded-lg shadow-2xs hover:bg-white cursor-pointer"
      >
        Hoy
      </Button>
    </div>
  );
}
