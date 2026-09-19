'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface TimeSelectProps {
  value: string; // "HH:mm"
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function TimeSelect({
  value,
  onChange,
  className,
  placeholder = '08:00',
  disabled = false,
}: TimeSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current value into HH and mm
  const [currentHour, currentMinute] = React.useMemo(() => {
    if (!value || !value.includes(':')) return ['08', '00'];
    const [h, m] = value.split(':');
    return [h.padStart(2, '0'), m.padStart(2, '0')];
  }, [value]);

  const selectedHourRef = React.useRef<HTMLButtonElement | null>(null);

  // Auto-scroll to current hour when popover opens
  React.useEffect(() => {
    if (open && selectedHourRef.current) {
      selectedHourRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [open]);

  const handleHourSelect = (hour: string) => {
    onChange(`${hour}:${currentMinute}`);
  };

  const handleMinuteSelect = (minute: string) => {
    onChange(`${currentHour}:${minute}`);
    setOpen(false);
  };

  // Support custom minutes if not in [00, 15, 30, 45]
  const minuteOptions = React.useMemo(() => {
    if (!MINUTES.includes(currentMinute)) {
      return [...MINUTES, currentMinute].sort();
    }
    return MINUTES;
  }, [currentMinute]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-28 h-9 px-2.5 justify-start text-xs font-mono font-medium rounded-lg shadow-2xs bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer',
            className
          )}
        >
          <Clock className="w-3.5 h-3.5 text-primary mr-1.5 shrink-0" />
          <span>{value || placeholder}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-44 p-2.5 rounded-2xl shadow-xl border-slate-200 bg-white"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="w-1/2 text-center">Hora</span>
          <span className="w-1/2 text-center">Minutos</span>
        </div>

        <div className="flex space-x-1.5 h-44">
          {/* Columna Horas (00-23) */}
          <div className="w-1/2 overflow-y-auto pr-0.5 space-y-0.5 overscroll-contain">
            {HOURS.map((h) => {
              const isSelected = h === currentHour;
              return (
                <button
                  key={h}
                  type="button"
                  ref={isSelected ? selectedHourRef : null}
                  onClick={() => handleHourSelect(h)}
                  className={cn(
                    'w-full py-1 text-center font-mono text-xs rounded-md transition cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                      : 'hover:bg-slate-100 text-slate-700 font-medium'
                  )}
                >
                  {h}
                </button>
              );
            })}
          </div>

          <div className="w-px bg-slate-100 my-1" />

          {/* Columna Minutos (00, 15, 30, 45) */}
          <div className="w-1/2 overflow-y-auto pr-0.5 space-y-0.5 overscroll-contain">
            {minuteOptions.map((m) => {
              const isSelected = m === currentMinute;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinuteSelect(m)}
                  className={cn(
                    'w-full py-1 text-center font-mono text-xs rounded-md transition cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                      : 'hover:bg-slate-100 text-slate-700 font-medium'
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
