import { describe, test, expect } from 'vitest';
import { dentroDoPeriodo } from '../periodos.mjs';

const agora = new Date(2026, 8, 25, 16, 0); // 25/09/2026
const d = (a, m, dia, h = 12) => new Date(a, m - 1, dia, h).toISOString();

describe('dentroDoPeriodo', () => {
  test('diário', () => {
    expect(dentroDoPeriodo(d(2026, 9, 25, 1), 'hoje', {}, agora)).toBe(true);
    expect(dentroDoPeriodo(d(2026, 9, 24, 23), 'hoje', {}, agora)).toBe(false);
  });
  test('mensal', () => expect(dentroDoPeriodo(d(2026, 8, 31), 'mes', {}, agora)).toBe(false));
  test('semestral (2º semestre começa em julho)', () => expect(dentroDoPeriodo(d(2026, 7, 1), 'semestre', {}, agora)).toBe(true));
  test('anual', () => expect(dentroDoPeriodo(d(2025, 12, 31), 'ano', {}, agora)).toBe(false));
  test('específico inclui o dia final inteiro', () => {
    expect(dentroDoPeriodo(d(2026, 7, 31, 23), 'especifico', { de: '2026-02-01', ate: '2026-07-31' })).toBe(true);
    expect(dentroDoPeriodo(d(2026, 8, 1, 0), 'especifico', { de: '2026-02-01', ate: '2026-07-31' })).toBe(false);
  });
  test('específico só com "de"', () => expect(dentroDoPeriodo(d(2027, 1, 1), 'especifico', { de: '2026-02-01' })).toBe(true));
});
