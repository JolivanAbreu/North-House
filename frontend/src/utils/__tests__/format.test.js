import { describe, test, expect } from 'vitest';
import { formatCurrency, buildWhatsappLink, getStatusMeta } from '../format.mjs';

describe('formatCurrency', () => {
  test('formata número como moeda brasileira', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50');
  });

  test('valor inválido retorna R$ 0,00', () => {
    expect(formatCurrency('abc')).toBe('R$ 0,00');
  });

  test('valor zero é formatado normalmente', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
});

describe('buildWhatsappLink', () => {
  test('sem telefone retorna null', () => {
    expect(buildWhatsappLink(null, 'oi')).toBeNull();
  });

  test('monta link com número limpo e mensagem codificada', () => {
    const link = buildWhatsappLink('(85) 99999-8888', 'Olá!');
    expect(link).toBe('https://wa.me/85999998888?text=Ol%C3%A1!');
  });

  test('sem mensagem, não inclui o parâmetro text', () => {
    const link = buildWhatsappLink('85999998888', '');
    expect(link).toBe('https://wa.me/85999998888');
  });
});

describe('getStatusMeta', () => {
  test('retorna metadados conhecidos para status válido', () => {
    expect(getStatusMeta('Concluído')).toEqual({ color: 'emerald', label: 'Concluído' });
  });

  test('status desconhecido cai no fallback "stone"', () => {
    expect(getStatusMeta('Status Inexistente')).toEqual({ color: 'stone', label: 'Status Inexistente' });
  });
});
