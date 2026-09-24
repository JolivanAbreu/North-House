// Utilitários de formatação usados em toda a aplicação.
// Centralizar aqui evita inconsistências (ex: R$ 1234.5 vs R$ 1.234,50).

export const formatCurrency = (value) => {
  const numero = parseFloat(value);
  if (isNaN(numero)) return 'R$ 0,00';
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const formatDate = (dataISO) => {
  if (!dataISO) return '-';
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dataISO) => {
  if (!dataISO) return '-';
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dataISO) => {
  if (!dataISO) return '-';
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
};

// Mapa de status -> estilos (cor) e ordem, usado em badges e no dashboard.
export const STATUS_META = {
  'Recebido': { color: 'blue', label: 'Recebido' },
  'Em preparo': { color: 'amber', label: 'Em preparo' },
  'Pronto para entrega': { color: 'violet', label: 'Pronto p/ entrega' },
  'Pronto para retirada': { color: 'violet', label: 'Pronto p/ retirada' },
  'Concluído': { color: 'emerald', label: 'Concluído' },
  'Cancelado': { color: 'rose', label: 'Cancelado' },
};

export const getStatusMeta = (status) =>
  STATUS_META[status] || { color: 'stone', label: status || 'Desconhecido' };

// Cor/estilo de cada tipo de comanda: usado pra diferenciar visualmente
// comandas locais (restaurante) de pedidos delivery/retirada na tela inicial.
export const TIPO_ENTREGA_META = {
  'Local': { color: 'violet', label: 'Comanda Local', borderClass: 'border-l-4 border-l-violet-500' },
  'Delivery': { color: 'delivery', label: 'Delivery', borderClass: 'border-l-4 border-l-[#ffb700]' },
  'Retirada': { color: 'amber', label: 'Retirada', borderClass: 'border-l-4 border-l-amber-500' },
};

export const getTipoEntregaMeta = (tipo) =>
  TIPO_ENTREGA_META[tipo] || { color: 'stone', label: tipo || 'Outro', borderClass: 'border-l-4 border-l-stone-300' };

// A partir dos itens de uma comanda, decide se ela mistura itens de
// mercearia, cardápio (restaurante) ou os dois - pro badge da tela de Comandas.
export const getOrigemComanda = (pedidoItems = []) => {
  let temMercearia = false;
  let temCardapio = false;
  for (const item of pedidoItems) {
    const tipo = item?.Produto?.Categoria?.tipo;
    if (tipo === 'mercearia') temMercearia = true;
    else temCardapio = true;
  }
  if (temMercearia && temCardapio) return { label: 'Mercearia + Restaurante', color: 'brand' };
  if (temMercearia) return { label: 'Mercearia', color: 'amber' };
  if (temCardapio) return { label: 'Restaurante', color: 'emerald' };
  return null;
};

// O banco guarda quantidade como DECIMAL (string tipo "1.000"), pra suportar
// itens vendidos por kg. Aqui removemos zeros à direita pra exibição
// (1.000 -> "1", 0.750 -> "0.75").
export const formatQuantidade = (quantidade) => {
  const numero = parseFloat(quantidade);
  if (isNaN(numero)) return quantidade;
  return numero % 1 === 0 ? String(numero) : numero.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
};

// Formata o preço de um produto conforme a unidade de venda (por unidade ou por kg).
export const formatPrecoUnidade = (preco, unidadeVenda) => {
  const valor = formatCurrency(preco);
  return unidadeVenda === 'kg' ? `${valor}/kg` : `${valor}/un`;
};

// Monta um link do WhatsApp com mensagem pré-preenchida.
export const buildWhatsappLink = (telefone, mensagem = '') => {
  if (!telefone) return null;
  const numeroLimpo = telefone.replace(/\D/g, '');
  const texto = encodeURIComponent(mensagem);
  return `https://wa.me/${numeroLimpo}${texto ? `?text=${texto}` : ''}`;
};
