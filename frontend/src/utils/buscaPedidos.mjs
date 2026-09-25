// Busca "inteligente" dos Relatórios: um campo só entende vários jeitos de
// procurar uma comanda/pedido. Todos os termos digitados precisam bater (E).
//
//   joao            -> cliente, produto, endereço, status, forma de pagamento...
//   #15             -> comanda nº 15
//   mesa 3          -> comanda da mesa 3
//   baiao pix       -> tem baião E foi paga no pix
//   >50  <=100      -> total acima de R$ 50 / até R$ 100
//   30-80           -> total entre R$ 30 e R$ 80
//   25/09           -> feita em 25/09 (também aceita 25/09/2026)
//   delivery, retirada, local, pago, "a pagar", cancelado...
import { formatCurrency, formatDateTime, formatQuantidade } from './format.mjs';

export const normalizar = (texto = '') =>
  String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const numero = (txt) => parseFloat(String(txt).replace(/\./g, '').replace(',', '.'));

// Quebra a busca em termos, mantendo juntos "mesa 3", "a pagar", "nao pago"
// e trechos entre aspas.
export const tokenizar = (busca = '') => {
  const tokens = [];
  let resto = normalizar(busca);
  resto = resto.replace(/"([^"]+)"/g, (_, frase) => {
    tokens.push({ tipo: 'texto', valor: frase.trim() });
    return ' ';
  });
  resto = resto.replace(/\bmesa\s*(\d+)\b/g, (_, n) => {
    tokens.push({ tipo: 'mesa', valor: n });
    return ' ';
  });
  resto = resto.replace(/\b(a pagar|nao pago|em aberto)\b/g, () => {
    tokens.push({ tipo: 'naoPago' });
    return ' ';
  });
  for (const parte of resto.split(' ').filter(Boolean)) {
    let m;
    if ((m = parte.match(/^#(\d+)$/))) tokens.push({ tipo: 'id', valor: Number(m[1]) });
    else if ((m = parte.match(/^(>=|<=|>|<)r?\$?(\d+(?:[.,]\d+)?)$/))) tokens.push({ tipo: 'valor', op: m[1], valor: numero(m[2]) });
    else if ((m = parte.match(/^r?\$?(\d+(?:[.,]\d+)?)-r?\$?(\d+(?:[.,]\d+)?)$/))) tokens.push({ tipo: 'faixa', min: numero(m[1]), max: numero(m[2]) });
    else if ((m = parte.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/))) tokens.push({ tipo: 'data', dia: Number(m[1]), mes: Number(m[2]), ano: m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : null });
    else if (parte === 'pago' || parte === 'pagos' || parte === 'paga' || parte === 'pagas') tokens.push({ tipo: 'pago' });
    else tokens.push({ tipo: 'texto', valor: parte });
  }
  return tokens;
};

// Texto único com tudo que pode ser procurado num pedido
export const textoDoPedido = (p) =>
  normalizar(
    [
      `#${p.id}`,
      p.nome_cliente,
      p.tipo_entrega,
      p.tipo_entrega === 'Local' ? 'local salao comanda' : 'externo',
      p.mesa_numero ? `mesa ${p.mesa_numero}` : '',
      p.status,
      p.forma_pagamento_ilustrativa,
      p.pago ? 'pago' : 'a pagar',
      p.telefone_cliente,
      p.endereco_entrega,
      formatCurrency(p.valor_total),
      formatDateTime(p.createdAt),
      ...(p.PedidoItems || []).map((i) => `${formatQuantidade(i.quantidade)}x ${i.Produto?.nome || ''} ${i.variacao_nome || ''} ${i.Produto?.Categoria?.nome || ''}`),
    ]
      .filter(Boolean)
      .join(' | '),
  );

const bate = (p, t, texto) => {
  const total = parseFloat(p.valor_total) || 0;
  switch (t.tipo) {
    case 'id':
      return p.id === t.valor;
    case 'mesa':
      return String(p.mesa_numero ?? '') === t.valor;
    case 'pago':
      return !!p.pago;
    case 'naoPago':
      return !p.pago;
    case 'valor':
      if (t.op === '>') return total > t.valor;
      if (t.op === '>=') return total >= t.valor;
      if (t.op === '<') return total < t.valor;
      return total <= t.valor;
    case 'faixa':
      return total >= Math.min(t.min, t.max) && total <= Math.max(t.min, t.max);
    case 'data': {
      const d = new Date(p.createdAt);
      return d.getDate() === t.dia && d.getMonth() + 1 === t.mes && (!t.ano || d.getFullYear() === t.ano);
    }
    default:
      return texto.includes(t.valor);
  }
};

export const filtrarPedidos = (pedidos, busca) => {
  const tokens = tokenizar(busca);
  if (tokens.length === 0) return pedidos;
  return pedidos.filter((p) => {
    const texto = textoDoPedido(p);
    return tokens.every((t) => bate(p, t, texto));
  });
};
