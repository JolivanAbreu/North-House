import { describe, test, expect, vi, beforeEach } from 'vitest';
import { downloadCSV } from '../csv.mjs';

describe('downloadCSV', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:fake-url');
    URL.revokeObjectURL = vi.fn();
  });

  test('cria e clica em um link de download com o nome de arquivo correto', () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    downloadCSV('relatorio.csv', ['Nome', 'Valor'], [['Bolo', 'R$ 10,00']]);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');

    document.createElement.mockRestore();
  });

  test('escapa valores com ponto e vírgula entre aspas', () => {
    let blobContent;
    global.Blob = vi.fn(function (parts) {
      blobContent = parts.join('');
      return {};
    });

    downloadCSV('teste.csv', ['A'], [['valor;com;ponto e vírgula']]);

    expect(blobContent).toContain('"valor;com;ponto e vírgula"');
  });
});
