/**
 * Canonical Spanish month names for UI display and export period titles.
 */
export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const MONTH_SHORT_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export interface MonthWindow {
  label: string;
  periodTitle: string;
  monthName: string;
  monthShort: string;
  year: number;
  month: number;
  start: string;
  end: string;
  lastDay: number;
}

export type PresetId = 'month' | 'sem1' | 'sem2' | 'sem3' | 'sem4' | 'all';

export interface DatePresetItem {
  id: PresetId;
  buttonLabel: string;
  tableLabel: string;
  periodTitle: string;
  startDate: string;
  endDate: string;
}

export interface DatePresetsConfig {
  window: MonthWindow;
  presets: DatePresetItem[];
  getPreset: (id: PresetId) => DatePresetItem;
}

/**
 * Resolves the calendar month window for a given ISO date (YYYY-MM-DD),
 * falling back to the current system date if omitted or invalid.
 */
export function resolveMonthWindow(referenceDate?: string): MonthWindow {
  const parsed =
    referenceDate && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
      ? new Date(`${referenceDate}T00:00:00.000Z`)
      : new Date();

  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;
  const mStr = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDayStr = String(lastDay).padStart(2, '0');

  const monthName = MONTH_NAMES[month - 1];
  const monthShort = MONTH_SHORT_NAMES[month - 1];
  const label = `${monthName} ${year}`;
  const periodTitle = `${monthName.toUpperCase()} ${year}`;

  return {
    label,
    periodTitle,
    monthName,
    monthShort,
    year,
    month,
    start: `${year}-${mStr}-01`,
    end: `${year}-${mStr}-${lastDayStr}`,
    lastDay,
  };
}

/**
 * Builds standard date presets (month, sem1..sem4, all) relative to a reference date.
 */
export function buildDatePresets(referenceDate?: string): DatePresetsConfig {
  const window = resolveMonthWindow(referenceDate);
  const { year, month, lastDay, monthName, monthShort, periodTitle } = window;
  const mStr = String(month).padStart(2, '0');
  const lastDayStr = String(lastDay).padStart(2, '0');

  const presets: DatePresetItem[] = [
    {
      id: 'month',
      buttonLabel: `Mes Completo (${monthShort} ${year})`,
      tableLabel: `Mes Completo (${monthName} ${year})`,
      periodTitle,
      startDate: `${year}-${mStr}-01`,
      endDate: `${year}-${mStr}-${lastDayStr}`,
    },
    {
      id: 'sem1',
      buttonLabel: 'Sem. 1 (1-7)',
      tableLabel: `Semana 1 (1-7 ${monthShort})`,
      periodTitle: `SEMANA 1 ${periodTitle}`,
      startDate: `${year}-${mStr}-01`,
      endDate: `${year}-${mStr}-07`,
    },
    {
      id: 'sem2',
      buttonLabel: 'Sem. 2 (8-14)',
      tableLabel: `Semana 2 (8-14 ${monthShort})`,
      periodTitle: `SEMANA 2 ${periodTitle}`,
      startDate: `${year}-${mStr}-08`,
      endDate: `${year}-${mStr}-14`,
    },
    {
      id: 'sem3',
      buttonLabel: 'Sem. 3 (15-21)',
      tableLabel: `Semana 3 (15-21 ${monthShort})`,
      periodTitle: `SEMANA 3 ${periodTitle}`,
      startDate: `${year}-${mStr}-15`,
      endDate: `${year}-${mStr}-21`,
    },
    {
      id: 'sem4',
      buttonLabel: 'Sem. 4 (22+)',
      tableLabel: `Semana 4 (22+ ${monthShort})`,
      periodTitle: `SEMANA 4 ${periodTitle}`,
      startDate: `${year}-${mStr}-22`,
      endDate: `${year}-${mStr}-${lastDayStr}`,
    },
    {
      id: 'all',
      buttonLabel: 'Todo',
      tableLabel: 'Todo el Histórico',
      periodTitle: 'HISTÓRICO COMPLETO',
      startDate: '',
      endDate: '',
    },
  ];

  const presetMap = new Map<PresetId, DatePresetItem>(
    presets.map((p) => [p.id, p])
  );

  return {
    window,
    presets,
    getPreset: (id: PresetId) =>
      presetMap.get(id) ?? presets[presets.length - 1],
  };
}

/**
 * Extracts the latest ISO date string (YYYY-MM-DD) from a collection of records.
 */
export function getLatestDate(
  items: Array<{ date: string } | string | undefined | null>
): string | undefined {
  let max: string | undefined;

  for (const item of items) {
    if (!item) continue;
    const date = typeof item === 'string' ? item : item.date;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      if (!max || date > max) {
        max = date;
      }
    }
  }

  return max;
}
