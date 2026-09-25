import { describe, test, expect } from 'vitest';
import { filtrarPedidos, tokenizar } from '../buscaPedidos.mjs';

const item = (nome, q = 1) => ({ quantidade: String(q), Produto: { nome, Categoria: { nome: 'Almoço' } } });
const pedidos = [
  { id: 15, nome_cliente: 'João da Silva', tipo_entrega: 'Local', mesa_numero: '3', status: 'Concluído', pago: true, forma_pagamento_ilustrativa: 'Pix', valor_total: '64.00', createdAt: '2026-09-25T15:00:00Z', PedidoItems: [item('Baião de Dois', 2)] },
  { id: 16, nome_cliente: 'Maria', tipo_entrega: 'Delivery', mesa_numero: null, status: 'Em preparo', pago: false, valor_total: '32.00', telefone_cliente: '85999998888', endereco_entrega: 'Rua das Flores, 120', createdAt: '2026-09-24T15:00:00Z', PedidoItems: [item('Picanha')] },
  { id: 17, nome_cliente: 'Comanda Local', tipo_entrega: 'Local', mesa_numero: '13', status: 'Concluído', pago: true, forma_pagamento_ilustrativa: 'Dinheiro', valor_total: '120.50', createdAt: '2026-09-25T18:00:00Z', PedidoItems: [item('Baião de Dois')] },
];
const ids = (busca) => filtrarPedidos(pedidos, busca).map((p) => p.id);

describe('busca inteligente de pedidos', () => {
  test('vazio retorna tudo', () => expect(ids('')).toEqual([15, 16, 17]));
  test('ignora acentos e maiúsculas', () => expect(ids('JOAO')).toEqual([15]));
  test('número da comanda', () => expect(ids('#16')).toEqual([16]));
  test('mesa exata (3 não pega a 13)', () => expect(ids('mesa 3')).toEqual([15]));
  test('produto + forma de pagamento', () => expect(ids('baiao pix')).toEqual([15]));
  test('valor mínimo', () => expect(ids('>50')).toEqual([15, 17]));
  test('faixa de valor', () => expect(ids('30-70')).toEqual([15, 16]));
  test('não pagos', () => expect(ids('a pagar')).toEqual([16]));
  test('pagos', () => expect(ids('pago')).toEqual([15, 17]));
  test('tipo e endereço', () => expect(ids('delivery flores')).toEqual([16]));
  test('data', () => expect(ids('24/09')).toEqual([16]));
  test('telefone', () => expect(ids('99999')).toEqual([16]));
  test('tokenizar reconhece valor com vírgula', () => expect(tokenizar('<=50,5')[0]).toEqual({ tipo: 'valor', op: '<=', valor: 50.5 }));
});
