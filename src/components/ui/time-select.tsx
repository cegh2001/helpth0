'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimeSelectProps {
  value: string; // "HH:mm"
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Generates times in 30-minute intervals covering a full 24-hour day
const BASE_TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    BASE_TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

export function TimeSelect({
  value,
  onChange,
  className,
  placeholder = '08:00',
  disabled = false,
}: TimeSelectProps) {
  // If a custom or existing value is not on the 30-min grid (e.g. "08:15"), include it seamlessly
  const options = React.useMemo(() => {
    if (value && !BASE_TIME_OPTIONS.includes(value)) {
      return [...BASE_TIME_OPTIONS, value].sort();
    }
    return BASE_TIME_OPTIONS;
  }, [value]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'w-28 bg-white text-xs font-mono font-medium h-9 shadow-2xs rounded-lg cursor-pointer border-slate-200 hover:border-slate-300',
          className
        )}
      >
        <div className="flex items-center space-x-1.5 truncate">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-56 rounded-xl shadow-xl border-slate-200">
        {options.map((t) => (
          <SelectItem
            key={t}
            value={t}
            className="text-xs font-mono font-medium cursor-pointer"
          >
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
