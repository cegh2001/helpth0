import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_MODULES,
  isModuleActive,
} from '@/components/dashboard/dashboard-modules';

describe('isModuleActive', () => {
  it('matches the exact route', () => {
    expect(isModuleActive('/medicos', '/medicos')).toBe(true);
  });

  it('matches a nested route of the module', () => {
    expect(isModuleActive('/medicos/horarios', '/medicos')).toBe(true);
  });

  it('does not match a route that merely shares the prefix', () => {
    expect(isModuleActive('/medicos-archivados', '/medicos')).toBe(false);
  });

  it('returns false for an unknown pathname', () => {
    expect(isModuleActive(null, '/medicos')).toBe(false);
  });
});

describe('DASHBOARD_MODULES', () => {
  it('exposes one unique route per module', () => {
    const hrefs = DASHBOARD_MODULES.map((module) => module.href);
    expect(new Set(hrefs).size).toBe(DASHBOARD_MODULES.length);
    expect(hrefs).toStrictEqual([
      '/consultas',
      '/examenes',
      '/terapias',
      '/recepcion',
      '/medicos',
      '/tarifas',
    ]);
  });
});
