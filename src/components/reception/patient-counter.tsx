import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PatientCounterProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'default' | 'compact';
  minusLabel: string;
  inputLabel: string;
  plusLabel: string;
}

export function PatientCounter({
  value,
  onChange,
  size = 'default',
  minusLabel,
  inputLabel,
  plusLabel,
}: PatientCounterProps) {
  const isCompact = size === 'compact';

  return (
    <div
      className={
        isCompact
          ? 'flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs'
          : 'flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200'
      }
    >
      <Button
        type="button"
        variant={isCompact ? 'ghost' : 'outline'}
        size="icon-sm"
        onClick={() => onChange(Math.max(0, value - 1))}
        title="Restar (-1)"
        aria-label={minusLabel}
        className={
          isCompact
            ? 'h-7 w-7 rounded-md cursor-pointer hover:bg-slate-100 active:scale-90'
            : 'h-8 w-8 rounded-lg cursor-pointer hover:bg-white active:scale-90'
        }
      >
        <Minus className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </Button>

      <Input
        type="number"
        min="0"
        aria-label={inputLabel}
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value) || 0)}
        className={
          isCompact
            ? 'w-10 h-7 text-center font-bold text-xs bg-transparent border-0 shadow-none focus-visible:ring-0 p-0'
            : 'w-14 h-8 text-center font-bold text-base bg-transparent border-0 shadow-none focus-visible:ring-0 p-0'
        }
      />

      <Button
        type="button"
        size="icon-sm"
        onClick={() => onChange(value + 1)}
        title="Sumar (+1)"
        aria-label={plusLabel}
        className={
          isCompact
            ? 'h-7 w-7 rounded-md cursor-pointer hover:bg-primary/90 active:scale-90'
            : 'h-8 w-8 rounded-lg cursor-pointer hover:bg-primary/90 active:scale-90'
        }
      >
        <Plus className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </Button>
    </div>
  );
}
