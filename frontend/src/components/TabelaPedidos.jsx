import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  Printer, ClipboardList, Search, ChevronDown, Eye, Trash2, X, Phone, MapPin, HelpCircle,
} from "lucide-react";
import api from "../services/api.mjs";
import { Card, CardHeader, CardBody } from "./ui/Card.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import Badge from "./ui/Badge.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import { formatCurrency, formatDateTime, getStatusMeta, getTipoEntregaMeta, formatQuantidade } from "../utils/format.mjs";
import { filtrarPedidos } from "../utils/buscaPedidos.mjs";
import { imprimirComanda } from "../utils/impressao.mjs";
import { formatarTelefone } from "../utils/mascaras.mjs";
import useTravarScroll from "../hooks/useTravarScroll.mjs";

// Tabela de pedidos/comandas usada nos Relatórios ("Pedidos no período") e
// na aba Pedidos (histórico completo): busca inteligente, linha expansível
// com os itens e ações de visualizar, imprimir e excluir.
//
// Props:
//   pedidos     lista já filtrada pela tela (período, status...)
//   perfil      perfil da loja (contatos no comprovante)
//   onExcluido  (id) => void, chamado depois de excluir no backend
//   titulo      título do card
// Só dá pra excluir do relatório o que já terminou (regra do backend)
const podeExcluir = (p) => ["Concluído", "Cancelado"].includes(p.status);
const POR_PAGINA = 50;

const EXEMPLOS_BUSCA = ["#15", "mesa 3", "baião pix", ">50", "30-80", "a pagar", "delivery", "25/09"];

const nomeCliente = (p) =>
  p.nome_cliente && !["Comanda Local", "Cliente"].includes(p.nome_cliente) ? p.nome_cliente : "—";

const localDoPedido = (p) =>
  p.tipo_entrega === "Local" ? (p.mesa_numero ? `Mesa ${p.mesa_numero}` : "Balcão") : p.tipo_entrega;

const TabelaPedidos = ({ pedidos: pedidosFiltrados, perfil, onExcluido, titulo = "Pedidos no período" }) => {
  const [busca, setBusca] = useState("");
  const [expandidos, setExpandidos] = useState(() => new Set());
  const [pedidoVisualizar, setPedidoVisualizar] = useState(null);
  const [pedidoExcluir, setPedidoExcluir] = useState(null);
  const [limite, setLimite] = useState(POR_PAGINA);
  const [mostrarAjuda, setMostrarAjuda] = useState(false);

  // Busca inteligente só na lista "Pedidos no período" (os totais acima
  // continuam refletindo o período/status escolhidos)
  const pedidosDaBusca = useMemo(() => filtrarPedidos(pedidosFiltrados, busca), [pedidosFiltrados, busca]);
  const totalDaBusca = useMemo(
    () => pedidosDaBusca.filter((p) => p.status !== "Cancelado").reduce((acc, p) => acc + (parseFloat(p.valor_total) || 0), 0),
    [pedidosDaBusca],
  );

  const alternarExpandido = (id) =>
    setExpandidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const handleExcluir = async () => {
    if (!pedidoExcluir) return;
    try {
      await api.delete(`/pedidos/admin/${pedidoExcluir.id}`);
      onExcluido?.(pedidoExcluir.id);
      if (pedidoVisualizar?.id === pedidoExcluir.id) setPedidoVisualizar(null);
      toast.success(`Comanda #${pedidoExcluir.id} excluída do relatório.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Não foi possível excluir.");
    } finally {
      setPedidoExcluir(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title={titulo}
          subtitle={
            busca.trim()
              ? `${pedidosDaBusca.length} de ${pedidosFiltrados.length} registros · ${formatCurrency(totalDaBusca)}`
              : `${pedidosFiltrados.length} registros`
          }
        />
        <CardBody>
          {/* Busca inteligente */}
          <div className="mb-4 print:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setLimite(POR_PAGINA); }}
                placeholder="Busque por cliente, nº, mesa, produto, pagamento, valor ou data…"
                className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {busca && (
                  <button onClick={() => setBusca("")} className="p-1.5 text-stone-400 hover:text-stone-700" aria-label="Limpar busca">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setMostrarAjuda((v) => !v)}
                  className={`p-1.5 rounded-lg ${mostrarAjuda ? "text-brand-600 bg-brand-50" : "text-stone-400 hover:text-stone-700"}`}
                  aria-label="Como buscar"
                  title="Como buscar"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-stone-400">Exemplos:</span>
              {EXEMPLOS_BUSCA.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setBusca(ex); setLimite(POR_PAGINA); }}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-stone-600 hover:bg-stone-200"
                >
                  {ex}
                </button>
              ))}
            </div>
            {mostrarAjuda && (
              <div className="mt-3 text-xs text-stone-600 bg-stone-50 border border-stone-100 rounded-xl p-3 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                <p><strong>joão</strong> — nome, produto, endereço, status…</p>
                <p><strong>#15</strong> — comanda número 15</p>
                <p><strong>mesa 3</strong> — só a mesa 3 (não pega a 13)</p>
                <p><strong>baião pix</strong> — combina termos (os dois precisam bater)</p>
                <p><strong>&gt;50</strong>, <strong>&lt;=100</strong> — total acima/até um valor</p>
                <p><strong>30-80</strong> — total entre R$ 30 e R$ 80</p>
                <p><strong>pago</strong>, <strong>a pagar</strong> — situação do pagamento</p>
                <p><strong>25/09</strong> — feitos nesse dia</p>
              </div>
            )}
          </div>

          {pedidosDaBusca.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={busca.trim() ? "Nada encontrado para essa busca" : "Nenhum pedido neste filtro"}
              description={busca.trim() ? "Tente menos termos ou outro período." : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                    <th className="w-8 p-3 print:hidden" aria-label="Expandir" />
                    <th className="text-left p-3">Pedido</th>
                    <th className="text-left p-3">Data</th>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Mesa / Tipo</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Pagamento</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-right p-3 print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosDaBusca.slice(0, limite).map((pedido) => {
                    const meta = getStatusMeta(pedido.status);
                    const aberto = expandidos.has(pedido.id);
                    const itens = pedido.PedidoItems || [];
                    return (
                      <React.Fragment key={pedido.id}>
                        <tr
                          className={`border-b border-stone-50 hover:bg-stone-50/70 cursor-pointer ${aberto ? "bg-stone-50/70" : ""}`}
                          onClick={() => alternarExpandido(pedido.id)}
                        >
                          <td className="p-3 print:hidden">
                            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${aberto ? "rotate-180" : ""}`} />
                          </td>
                          <td className="p-3 font-medium text-stone-800">#{pedido.id}</td>
                          <td className="p-3 text-stone-500 whitespace-nowrap">{formatDateTime(pedido.createdAt)}</td>
                          <td className="p-3 text-stone-700">{nomeCliente(pedido)}</td>
                          <td className="p-3 text-stone-600 whitespace-nowrap">{localDoPedido(pedido)}</td>
                          <td className="p-3"><Badge color={meta.color}>{meta.label}</Badge></td>
                          <td className="p-3 text-stone-500">{pedido.pago ? pedido.forma_pagamento_ilustrativa || "Pago" : "A pagar"}</td>
                          <td className="p-3 text-right font-semibold text-stone-800 tabular-nums">{formatCurrency(pedido.valor_total)}</td>
                          <td className="p-3 print:hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <AcaoBtn title="Visualizar" onClick={() => setPedidoVisualizar(pedido)}><Eye className="w-4 h-4" /></AcaoBtn>
                              <AcaoBtn title="Imprimir" onClick={() => imprimirComanda(pedido, perfil)} disabled={itens.length === 0}>
                                <Printer className="w-4 h-4" />
                              </AcaoBtn>
                              <AcaoBtn
                                title={podeExcluir(pedido) ? "Excluir" : "Só é possível excluir comandas concluídas ou canceladas"}
                                onClick={() => setPedidoExcluir(pedido)}
                                disabled={!podeExcluir(pedido)}
                                perigo
                              >
                                <Trash2 className="w-4 h-4" />
                              </AcaoBtn>
                            </div>
                          </td>
                        </tr>
                        {aberto && (
                          <tr className="border-b border-stone-100 bg-stone-50/70">
                            <td className="print:hidden" />
                            <td colSpan={8} className="px-3 pb-4 pt-1">
                              <DetalheItens pedido={pedido} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {pedidosDaBusca.length > limite && (
                <div className="text-center pt-4 print:hidden">
                  <button
                    onClick={() => setLimite((l) => l + POR_PAGINA)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200"
                  >
                    Mostrar mais ({pedidosDaBusca.length - limite} restantes)
                  </button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {pedidoVisualizar && createPortal(
        <VisualizarPedido
          pedido={pedidoVisualizar}
          onFechar={() => setPedidoVisualizar(null)}
          onImprimir={() => imprimirComanda(pedidoVisualizar, perfil)}
          onExcluir={podeExcluir(pedidoVisualizar) ? () => setPedidoExcluir(pedidoVisualizar) : null}
        />,
        document.body,
      )}

      <ConfirmationModal
        show={!!pedidoExcluir}
        onClose={() => setPedidoExcluir(null)}
        onConfirm={handleExcluir}
        title="Excluir comanda do relatório"
        message={`Excluir a comanda #${pedidoExcluir?.id} (${pedidoExcluir ? formatCurrency(pedidoExcluir.valor_total) : ""})? Ela sai dos relatórios e dos totais. Essa ação não pode ser desfeita.`}
      />
    </>
  );
};

const AcaoBtn = ({ children, title, onClick, disabled, perigo }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg text-stone-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
      perigo ? "hover:text-rose-600 hover:bg-rose-50" : "hover:text-stone-900 hover:bg-stone-100"
    }`}
  >
    {children}
  </button>
);

// Itens + contato + totais: usado na linha expandida e no "Visualizar"
const DetalheItens = ({ pedido }) => {
  const itens = pedido.PedidoItems || [];
  const desconto = parseFloat(pedido.valor_desconto || 0);
  return (
    <div className="grid md:grid-cols-[1fr_240px] gap-4">
      <div>
        {itens.length === 0 ? (
          <p className="text-xs text-stone-400">Sem itens lançados.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-400 uppercase tracking-wide">
                <th className="text-left py-1.5 font-semibold">Produto</th>
                <th className="text-right py-1.5 font-semibold">Qtd</th>
                <th className="text-right py-1.5 font-semibold">Unit.</th>
                <th className="text-right py-1.5 font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-t border-stone-200/60">
                  <td className="py-1.5 text-stone-700">
                    {item.Produto?.nome || "Produto"}
                    {item.variacao_nome && <span className="text-stone-400"> ({item.variacao_nome})</span>}
                  </td>
                  <td className="py-1.5 text-right text-stone-600 tabular-nums">{formatQuantidade(item.quantidade)}</td>
                  <td className="py-1.5 text-right text-stone-500 tabular-nums">{formatCurrency(item.preco_unitario)}</td>
                  <td className="py-1.5 text-right font-semibold text-stone-800 tabular-nums">
                    {formatCurrency(parseFloat(item.preco_unitario) * parseFloat(item.quantidade))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="text-xs space-y-1.5 bg-white border border-stone-100 rounded-xl p-3 self-start">
        {pedido.telefone_cliente && (
          <p className="flex items-center gap-1.5 text-stone-600"><Phone className="w-3.5 h-3.5 text-stone-400" /> {formatarTelefone(pedido.telefone_cliente)}</p>
        )}
        {pedido.endereco_entrega && (
          <p className="flex items-start gap-1.5 text-stone-600"><MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" /> {pedido.endereco_entrega}</p>
        )}
        <div className="flex justify-between text-stone-500"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(pedido.subtotal)}</span></div>
        {desconto > 0 && (
          <div className="flex justify-between text-emerald-600"><span>Desconto</span><span className="tabular-nums">- {formatCurrency(desconto)}</span></div>
        )}
        <div className="flex justify-between font-bold text-stone-900 text-sm pt-1 border-t border-stone-100">
          <span>Total</span><span className="tabular-nums">{formatCurrency(pedido.valor_total)}</span>
        </div>
        <div className="flex justify-between text-stone-500">
          <span>Pagamento</span><span>{pedido.pago ? pedido.forma_pagamento_ilustrativa || "Pago" : "A pagar"}</span>
        </div>
      </div>
    </div>
  );
};

const VisualizarPedido = ({ pedido, onFechar, onImprimir, onExcluir }) => {
  useTravarScroll(true);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFechar]);
  const tipo = getTipoEntregaMeta(pedido.tipo_entrega);
  const status = getStatusMeta(pedido.status);
  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn" onClick={onFechar}>
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border-t-8 animate-slideUp ${tipo.topoClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-stone-100">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Comanda #{pedido.id}</p>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-stone-900 truncate mt-0.5">{nomeCliente(pedido)}</h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Badge color={tipo.color}>{localDoPedido(pedido)}</Badge>
              <Badge color={status.color}>{status.label}</Badge>
              <Badge color={pedido.pago ? "emerald" : "rose"}>{pedido.pago ? "Pago" : "A pagar"}</Badge>
            </div>
            <p className="text-xs text-stone-500 mt-2">Aberta em {formatDateTime(pedido.createdAt)} · atualizada em {formatDateTime(pedido.updatedAt)}</p>
          </div>
          <button onClick={onFechar} className="p-2 text-stone-400 hover:text-stone-700 border border-stone-200 rounded-xl" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">
          <DetalheItens pedido={pedido} />
        </div>
        <div className="flex flex-wrap justify-end gap-2 p-4 sm:px-6 bg-stone-50 border-t border-stone-100">
          {onExcluir && (
            <button onClick={onExcluir} className="mr-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          )}
          <button onClick={onFechar} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50">
            Fechar
          </button>
          <button
            onClick={onImprimir}
            disabled={!(pedido.PedidoItems || []).length}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabelaPedidos;
