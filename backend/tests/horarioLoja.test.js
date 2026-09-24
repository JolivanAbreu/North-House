const { lojaEstaAberta } = require('../utils/horarioLoja');

describe('lojaEstaAberta', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('loja pausada manualmente sempre fica fechada, mesmo dentro do horário', () => {
    const usuario = { loja_pausada: true, horarios_funcionamento: null };
    const resultado = lojaEstaAberta(usuario);
    expect(resultado.aberta).toBe(false);
  });

  test('sem horário configurado, loja fica sempre aberta (comportamento antigo)', () => {
    const usuario = { loja_pausada: false, horarios_funcionamento: null };
    const resultado = lojaEstaAberta(usuario);
    expect(resultado.aberta).toBe(true);
  });

  test('dentro do horário configurado do dia, loja está aberta', () => {
    // Quarta-feira, 10h -- dentro de 08:00-18:00
    jest.useFakeTimers().setSystemTime(new Date('2026-07-22T10:00:00'));
    const horarios = { qua: { ativo: true, abre: '08:00', fecha: '18:00' } };
    const usuario = { loja_pausada: false, horarios_funcionamento: JSON.stringify(horarios) };
    const resultado = lojaEstaAberta(usuario);
    expect(resultado.aberta).toBe(true);
  });

  test('fora do horário configurado do dia, loja está fechada', () => {
    // Quarta-feira, 20h -- fora de 08:00-18:00
    jest.useFakeTimers().setSystemTime(new Date('2026-07-22T20:00:00'));
    const horarios = { qua: { ativo: true, abre: '08:00', fecha: '18:00' } };
    const usuario = { loja_pausada: false, horarios_funcionamento: JSON.stringify(horarios) };
    const resultado = lojaEstaAberta(usuario);
    expect(resultado.aberta).toBe(false);
    expect(resultado.motivo).toMatch(/08:00.*18:00/);
  });

  test('dia marcado como inativo (loja não abre) fica fechada', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-26T10:00:00')); // domingo
    const horarios = { dom: { ativo: false, abre: '08:00', fecha: '18:00' } };
    const usuario = { loja_pausada: false, horarios_funcionamento: JSON.stringify(horarios) };
    const resultado = lojaEstaAberta(usuario);
    expect(resultado.aberta).toBe(false);
    expect(resultado.motivo).toMatch(/não abre hoje/);
  });

  test('JSON inválido em horarios_funcionamento não quebra e mantém loja aberta', () => {
    const usuario = { loja_pausada: false, horarios_funcionamento: '{isso não é json' };
    const resultado = lojaEstaAberta(usuario);
    expect(resultado.aberta).toBe(true);
  });
});
