import { describe, test, expect } from 'vitest';
import { capitalizarNome, somenteDigitos } from '../mascaras.mjs';
import { tempoDecorrido, getTipoEntregaMeta } from '../format.mjs';

describe('capitalizarNome', () => {
  test('padroniza espaços e maiúsculas', () => {
    expect(capitalizarNome('  joão   DA silva ')).toBe('João da Silva');
  });
  test('primeira palavra sempre maiúscula', () => {
    expect(capitalizarNome('de souza')).toBe('De Souza');
  });
  test('vazio continua vazio', () => {
    expect(capitalizarNome('')).toBe('');
  });
});

describe('somenteDigitos', () => {
  test('remove máscara de telefone', () => {
    expect(somenteDigitos('(85) 99999-8888')).toBe('85999998888');
  });
});

describe('tempoDecorrido', () => {
  const agora = new Date('2026-09-25T12:00:00Z');
  test('minutos', () => {
    expect(tempoDecorrido('2026-09-25T11:35:00Z', agora)).toBe('há 25 min');
  });
  test('horas e minutos', () => {
    expect(tempoDecorrido('2026-09-25T10:40:00Z', agora)).toBe('há 1 h 20 min');
  });
  test('recém aberta', () => {
    expect(tempoDecorrido('2026-09-25T11:59:40Z', agora)).toBe('agora');
  });
});

describe('getTipoEntregaMeta', () => {
  test('delivery tem cor diferente da comanda local', () => {
    expect(getTipoEntregaMeta('Delivery').cardClass).not.toBe(getTipoEntregaMeta('Local').cardClass);
  });
  test('tipo desconhecido tem fallback', () => {
    expect(getTipoEntregaMeta('X').cardClass).toBeTruthy();
  });
});

import { formatQuantidade } from '../format.mjs';
describe('formatQuantidade', () => {
  test('inteiro sem casas', () => expect(formatQuantidade('2.000')).toBe('2'));
  test('kg com vírgula', () => expect(formatQuantidade('0.350')).toBe('0,35'));
});

import { formatarTelefone } from '../mascaras.mjs';
describe('formatarTelefone', () => {
  test('celular', () => expect(formatarTelefone('85999998888')).toBe('(85) 99999-8888'));
  test('com código do país', () => expect(formatarTelefone('5585999998888')).toBe('(85) 99999-8888'));
});
