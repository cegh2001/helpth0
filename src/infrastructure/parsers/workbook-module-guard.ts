import ExcelJS from 'exceljs';

/**
 * Import guard: decides which clinic module a spreadsheet belongs to before it
 * reaches a parser.
 *
 * The three source workbooks share the generic "Control de Pago" sheet name, so
 * the sheet name alone cannot discriminate them. The decisive evidence is the
 * summary sheet (`Resumen de Terapias` / `Resumen de Consultas` /
 * `Resumen de Exámenes`) and the clinical header labels (Terapeuta, Medicos,
 * Examenes). A confident mismatch is rejected; an unrecognized workbook is left
 * to the parser so legacy formats keep working.
 */
export type ImportModule = 'terapias' | 'consultas' | 'examenes';

export interface WorkbookScan {
  sheetNames: string[];
  headerLabels: string[];
}

export interface ImportModuleRejection {
  detected: ImportModule;
  expected: ImportModule;
  message: string;
}

const MODULES: readonly ImportModule[] = ['terapias', 'consultas', 'examenes'];

const MODULE_LABELS: Record<ImportModule, string> = {
  terapias: 'Terapias (fisioterapia)',
  consultas: 'Consultas',
  examenes: 'Exámenes',
};

const SHEET_PATTERNS: Record<ImportModule, RegExp> = {
  terapias: /terapeut|terapia|fisio/,
  consultas: /medic|consult/,
  examenes: /exam|laborator/,
};

const HEADER_LABELS: Record<ImportModule, readonly string[]> = {
  terapias: ['terapeuta', 'terapeutas', 'terapia', 'terapias', 'fisioterapia'],
  consultas: ['medico', 'medicos', 'consulta', 'consultas'],
  examenes: ['examen', 'examenes', 'laboratorio', 'laboratorios'],
};

const SHEET_SCORE = 2;
const HEADER_SCORE = 1;
const MIN_DETECTION_SCORE = 2;
const HEADER_SCAN_ROWS = 10;

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function scanWorkbook(workbook: ExcelJS.Workbook): WorkbookScan {
  const sheetNames = workbook.worksheets.map((worksheet) => worksheet.name);
  const labels = new Set<string>();

  for (const worksheet of workbook.worksheets) {
    if (normalize(worksheet.name).includes('resumen')) continue;

    const lastRow = Math.min(HEADER_SCAN_ROWS, worksheet.rowCount);
    for (let rowNumber = 1; rowNumber <= lastRow; rowNumber++) {
      worksheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
        if (typeof cell.value === 'string') {
          labels.add(normalize(cell.value));
        }
      });
    }
  }

  return { sheetNames, headerLabels: [...labels] };
}

export function classifyWorkbookModule(scan: WorkbookScan): ImportModule | null {
  const scores = new Map<ImportModule, number>(MODULES.map((candidate) => [candidate, 0]));

  for (const sheetName of scan.sheetNames) {
    const normalized = normalize(sheetName);
    for (const candidate of MODULES) {
      if (SHEET_PATTERNS[candidate].test(normalized)) {
        scores.set(candidate, (scores.get(candidate) ?? 0) + SHEET_SCORE);
      }
    }
  }

  for (const label of scan.headerLabels) {
    for (const candidate of MODULES) {
      if (HEADER_LABELS[candidate].includes(label)) {
        scores.set(candidate, (scores.get(candidate) ?? 0) + HEADER_SCORE);
      }
    }
  }

  const ranked = MODULES.map((candidate) => ({
    module: candidate,
    score: scores.get(candidate) ?? 0,
  })).sort((left, right) => right.score - left.score);

  const [best, runnerUp] = ranked;
  if (!best || best.score < MIN_DETECTION_SCORE) return null;
  if (runnerUp && runnerUp.score === best.score) return null;
  return best.module;
}

export function buildWrongModuleMessage(detected: ImportModule, expected: ImportModule): string {
  return `Este archivo es de ${MODULE_LABELS[detected]} y lo estás subiendo en ${MODULE_LABELS[expected]}. No se importó ningún dato: subilo desde el módulo de ${MODULE_LABELS[detected]}.`;
}

export class WorkbookModuleGuard {
  async detectWrongModule(
    buffer: Buffer,
    expected: ImportModule
  ): Promise<ImportModuleRejection | null> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const detected = classifyWorkbookModule(scanWorkbook(workbook));
    if (!detected || detected === expected) return null;

    return {
      detected,
      expected,
      message: buildWrongModuleMessage(detected, expected),
    };
  }
}
