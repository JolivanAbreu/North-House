jest.mock('../models/Cupom');
const Cupom = require('../models/Cupom');
const { validarCupomInterno } = require('../controllers/cupomController');

describe('validarCupomInterno', () => {
  afterEach(() => jest.clearAllMocks());

  test('cupom inexistente retorna inválido', async () => {
    Cupom.findOne.mockResolvedValue(null);
    const resultado = await validarCupomInterno(1, 'NAOEXISTE', 100);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toMatch(/não encontrado/i);
  });

  test('cupom percentual calcula o desconto corretamente', async () => {
    Cupom.findOne.mockResolvedValue({
      ativo: true, validade: null, usos_max: null, usos_atual: 0,
      pedido_minimo: 0, tipo: 'percentual', valor: 10, codigo: 'DEZ',
    });
    const resultado = await validarCupomInterno(1, 'dez', 200);
    expect(resultado.valido).toBe(true);
    expect(resultado.desconto).toBe(20);
  });

  test('cupom fixo nunca deixa o desconto passar do subtotal', async () => {
    Cupom.findOne.mockResolvedValue({
      ativo: true, validade: null, usos_max: null, usos_atual: 0,
      pedido_minimo: 0, tipo: 'fixo', valor: 500, codigo: 'MEGA',
    });
    const resultado = await validarCupomInterno(1, 'MEGA', 30);
    expect(resultado.valido).toBe(true);
    expect(resultado.desconto).toBe(30);
  });

  test('cupom expirado é rejeitado', async () => {
    Cupom.findOne.mockResolvedValue({
      ativo: true, validade: '2020-01-01', usos_max: null, usos_atual: 0,
      pedido_minimo: 0, tipo: 'fixo', valor: 10,
    });
    const resultado = await validarCupomInterno(1, 'VELHO', 100);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toMatch(/expirou/i);
  });

  test('cupom que já bateu o limite de usos é rejeitado', async () => {
    Cupom.findOne.mockResolvedValue({
      ativo: true, validade: null, usos_max: 5, usos_atual: 5,
      pedido_minimo: 0, tipo: 'fixo', valor: 10,
    });
    const resultado = await validarCupomInterno(1, 'ESGOTADO', 100);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toMatch(/limite/i);
  });

  test('pedido abaixo do mínimo exigido é rejeitado', async () => {
    Cupom.findOne.mockResolvedValue({
      ativo: true, validade: null, usos_max: null, usos_atual: 0,
      pedido_minimo: 50, tipo: 'fixo', valor: 10,
    });
    const resultado = await validarCupomInterno(1, 'MIN50', 20);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toMatch(/mínimo/i);
  });
});
