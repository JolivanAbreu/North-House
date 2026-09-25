import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus, ShoppingBag, Printer, Wallet, Trash2, ChevronUp, Maximize2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.mjs";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import NovaComandaModal from "../../components/NovaComandaModal.jsx";
import AdicionarItemModal from "../../components/AdicionarItemModal.jsx";
import PagamentoComandaModal from "../../components/PagamentoComandaModal.jsx";
import {
  formatCurrency, formatDateTime, getTipoEntregaMeta, formatQuantidade,
} from "../../utils/format.mjs";
import { imprimirComanda } from "../../utils/impressao.mjs";

const FILTROS_TIPO = [
  { value: "Todas", label: "Todas" },
  { value: "Local", label: "Comandas locais" },
  { value: "Delivery", label: "Delivery" },
  { value: "Retirada", label: "Retirada" },
];

const ehComandaAtiva = (pedido) => {
  if (pedido.arquivado_em) return false;
  if (pedido.tipo_entrega === "Local") return true; 
  return !["Concluído", "Cancelado"].includes(pedido.status);
};

const Comandas = () => {
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [nomeLoja, setNomeLoja] = useState("Loja");
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("Todas");
  const [isMounted, setIsMounted] = useState(false);

  const [showNovaComanda, setShowNovaComanda] = useState(false);
  const [abrindoComanda, setAbrindoComanda] = useState(false);

  const [comandaParaAdicionarItem, setComandaParaAdicionarItem] = useState(null);
  const [adicionandoItem, setAdicionandoItem] = useState(false);

  const [comandaParaPagar, setComandaParaPagar] = useState(null);
  const [finalizando, setFinalizando] = useState(false);

  // Estados de visualização da comanda
  const [comandaExpandidaId, setComandaExpandidaId] = useState(null);
  const [comandaModalId, setComandaModalId] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Trava o scroll da página quando o modal da comanda está aberto
  useEffect(() => {
    if (comandaModalId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [comandaModalId]);

  const fetchTudo = useCallback(async () => {
    try {
      setLoading(true);
      const [resPedidos, resMesas, resProdutos, resPerfil] = await Promise.all([
        api.get("/pedidos/admin"),
        api.get("/mesas"),
        api.get("/produtos"),
        api.get("/perfil"),
      ]);
      setPedidos(resPedidos.data);
      setMesas(resMesas.data);
      setProdutos(resProdutos.data);
      setNomeLoja(resPerfil.data?.nome_loja || "Loja");
    } catch (error) {
      console.error("Erro ao carregar tela de comandas:", error);
      toast.error("Erro ao carregar comandas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTudo();
  }, [fetchTudo]);

  const comandasAtivas = useMemo(() => {
    return pedidos
      .filter(ehComandaAtiva)
      .filter((p) => filtroTipo === "Todas" || p.tipo_entrega === filtroTipo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [pedidos, filtroTipo]);

  const mesasLivres = useMemo(() => mesas.filter((m) => m.status === "livre"), [mesas]);

  const comandaNoModal = useMemo(() => {
    return comandasAtivas.find((c) => c.id === comandaModalId);
  }, [comandasAtivas, comandaModalId]);

  const handleAbrirComanda = async ({ nome_cliente, mesaId }) => {
    setAbrindoComanda(true);
    try {
      const response = await api.post("/pedidos/admin", { nome_cliente, mesaId });
      setPedidos((prev) => [response.data, ...prev]);
      setShowNovaComanda(false);
      toast.success("Comanda aberta! Agora adicione os itens.");
      setComandaParaAdicionarItem(response.data);
      fetchTudo();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao abrir comanda.");
    } finally {
      setAbrindoComanda(false);
    }
  };

  const handleAdicionarItem = async ({ produtoId, quantidade }) => {
    if (!comandaParaAdicionarItem) return;
    setAdicionandoItem(true);
    try {
      const itemExistente = comandaParaAdicionarItem.PedidoItems?.find(
        (item) => String(item.Produto?.id || item.ProdutoId || item.produto_id) === String(produtoId)
      );

      if (itemExistente) {
        const novaQuantidade = parseFloat(itemExistente.quantidade) + parseFloat(quantidade);
        await api.put(`/pedidos/admin/${comandaParaAdicionarItem.id}/itens/${itemExistente.id}`, {
          quantidade: novaQuantidade
        });
      } else {
        await api.post(`/pedidos/admin/${comandaParaAdicionarItem.id}/itens`, { produtoId, quantidade });
      }

      await fetchTudo();
      
      setComandaParaAdicionarItem(null);
      toast.success(itemExistente ? "Quantidade atualizada!" : "Item adicionado!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao adicionar item.");
    } finally {
      setAdicionandoItem(false);
    }
  };

  const handleRemoverItem = async (comanda, itemId) => {
    try {
      await api.delete(`/pedidos/admin/${comanda.id}/itens/${itemId}`);
      await fetchTudo(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao remover item.");
    }
  };

  const handleGerarPix = async (comandaId) => {
    const response = await api.post(`/pedidos/admin/${comandaId}/pix`);
    return response.data;
  };

  const handleFinalizar = async (comandaId, forma_pagamento) => {
    setFinalizando(true);
    try {
      const response = await api.put(`/pedidos/admin/${comandaId}/finalizar`, { forma_pagamento });
      setPedidos((prev) => prev.map((p) => (p.id === response.data.id ? response.data : p)));
      setMesas((prev) => prev.map((m) => (m.id === response.data.MesaId ? { ...m, status: "livre" } : m)));
      setComandaParaPagar(null);
      toast.success("Comanda paga e finalizada!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao finalizar comanda.");
    } finally {
      setFinalizando(false);
    }
  };

  const handleDispensar = (comandaId) => {
    setPedidos((prev) => prev.filter((p) => p.id !== comandaId));
    setComandaExpandidaId((atual) => (atual === comandaId ? null : atual));
    if (comandaModalId === comandaId) setComandaModalId(null);
  };

  const handleReabrir = async (comanda) => {
    try {
      await api.put(`/pedidos/admin/${comanda.id}/reabrir`);
      toast.success("Comanda reaberta.");
      fetchTudo();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao reabrir comanda.");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Comandas" />
        <div className="columns-1 sm:columns-2 xl:columns-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-3xl border border-stone-100 animate-pulse mb-4 break-inside-avoid shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn pb-16">
      <PageHeader
        title="Comandas"
        subtitle={`${comandasAtivas.length} comanda(s) em andamento`}
        action={
          <button
            onClick={() => setShowNovaComanda(true)}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-soft"
          >
            <Plus className="w-4 h-4" /> Nova comanda
          </button>
        }
      />

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTROS_TIPO.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroTipo(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filtroTipo === f.value ? "bg-stone-900 text-white shadow-sm" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {comandasAtivas.length === 0 ? (
        <Card><EmptyState icon={ShoppingBag} title="Nenhuma comanda em andamento" description="Abra uma nova comanda local ou aguarde novos pedidos de delivery." /></Card>
      ) : (
        <div className="columns-1 sm:columns-2 xl:columns-4 gap-4">
          {comandasAtivas.map((comanda) => {
            const tipoMeta = getTipoEntregaMeta(comanda.tipo_entrega);
            const expandida = comanda.id === comandaExpandidaId;
            const ehLocal = comanda.tipo_entrega === "Local";

            if (!expandida) {
              return (
                <div key={comanda.id} className="break-inside-avoid mb-4">
                  <div
                    onClick={() => setComandaExpandidaId(comanda.id)}
                    className={`w-full text-left bg-white rounded-3xl border border-stone-100/80 ${tipoMeta.borderClass} p-5 shadow-sm hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col group`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4 w-full">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-stone-900 truncate mb-1">
                          {comanda.nome_cliente || "Comanda Local"}
                        </h3>
                        <Badge color={tipoMeta.color}>{tipoMeta.label}</Badge>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setComandaModalId(comanda.id); }}
                        className="p-1.5 text-stone-400 hover:text-brand-600 bg-stone-50 hover:bg-brand-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 border border-stone-100"
                        title="Abrir em modal"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 w-full pt-3 border-t border-stone-50">
                      <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                        {comanda.mesa_numero ? `Mesa ${comanda.mesa_numero}` : "Balcão"}
                      </span>
                      <Badge color={comanda.pago ? "emerald" : "rose"}>{comanda.pago ? "Paga" : "Aberta"}</Badge>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={comanda.id} className="break-inside-avoid mb-4">
                <div
                  className={`w-full bg-white rounded-3xl border border-stone-200/60 shadow-xl overflow-hidden animate-fadeIn flex flex-col ${tipoMeta.borderClass}`}
                >
                  {/* Cabeçalho da Comanda */}
                  <div
                    onClick={() => setComandaExpandidaId(null)}
                    className="w-full flex items-start justify-between gap-3 p-4 sm:p-5 bg-gradient-to-br from-white to-stone-50 border-b border-stone-100 cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h2 className="text-xl font-bold font-display truncate text-stone-900 leading-none">
                          {comanda.nome_cliente || "Comanda Local"}
                        </h2>
                        {comanda.mesa_numero && (
                          <span className="shrink-0 px-2 py-0.5 bg-stone-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                            Mesa {comanda.mesa_numero}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 font-medium truncate">{formatDateTime(comanda.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setComandaModalId(comanda.id); setComandaExpandidaId(null); }}
                        className="text-stone-400 hover:text-brand-600 p-1.5 bg-white hover:bg-brand-50 border border-stone-200 rounded-lg shadow-sm transition-all"
                        title="Abrir em tela cheia"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="text-stone-400 hover:text-stone-800 p-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg shadow-sm transition-all"
                        title="Minimizar"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Corpo da Comanda (Itens e Badges) */}
                  <div className="p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color={tipoMeta.color}>{tipoMeta.label}</Badge>
                      <Badge color={comanda.pago ? "emerald" : "rose"}>{comanda.pago ? "Paga" : "Aberta"}</Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-800 text-[11px] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        Itens da Comanda <span className="h-px bg-stone-200 flex-1"></span>
                      </h3>
                      {(!comanda.PedidoItems || comanda.PedidoItems.length === 0) ? (
                        <div className="py-4 text-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                          <p className="text-sm text-stone-500">Nenhum item adicionado.</p>
                        </div>
                      ) : (
                        <ul className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                          {comanda.PedidoItems.map((item) => (
                            <li key={item.id} className="flex justify-between items-center p-2.5 bg-stone-50/80 border border-stone-100 shadow-sm rounded-xl text-sm transition-colors hover:bg-stone-100">
                              <span className="font-semibold text-stone-800 truncate pr-2">
                                {item.quantidade}x <span className="font-medium text-stone-600 ml-1">{item.Produto?.nome || "Produto"}</span>
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-stone-800 font-bold">{formatCurrency(parseFloat(item.preco_unitario) * parseFloat(item.quantidade))}</span>
                                {ehLocal && !comanda.pago && (
                                  <button onClick={() => handleRemoverItem(comanda, item.id)} className="text-stone-300 hover:text-rose-600 bg-white p-1.5 rounded-lg border border-stone-200 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {ehLocal && !comanda.pago && (
                        <button
                          onClick={() => setComandaParaAdicionarItem(comanda)}
                          className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-600 bg-white hover:text-brand-600 hover:bg-brand-50 border border-dashed border-stone-300 hover:border-brand-300 transition-all px-3 py-2.5 rounded-xl shadow-sm"
                        >
                          <Plus className="w-4 h-4" /> Adicionar item
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rodapé da Comanda (Totais e Ações) */}
                  <div className="bg-stone-50 p-4 sm:p-5 border-t border-stone-200/60 mt-auto">
                    <div className="flex justify-between items-center text-sm text-stone-500 mb-1.5">
                      <span className="font-medium">Subtotal</span>
                      <span>{formatCurrency(comanda.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-sm font-bold text-stone-800">Total</span>
                      <span className="text-2xl font-black font-display text-stone-900 leading-none">{formatCurrency(comanda.valor_total)}</span>
                    </div>

                    {!comanda.pago ? (
                      <button
                        onClick={() => setComandaParaPagar(comanda)}
                        disabled={!comanda.PedidoItems || comanda.PedidoItems.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none disabled:cursor-not-allowed"
                      >
                        <Wallet className="w-4 h-4" /> Pagar comanda
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => imprimirComanda(comanda, nomeLoja)}
                          className="flex-1 flex items-center justify-center gap-2 bg-stone-800 text-white py-3 px-3 rounded-xl font-bold text-sm hover:bg-stone-900 transition-all shadow-md hover:shadow-lg"
                        >
                          <Printer className="w-4 h-4 shrink-0" /> <span className="truncate">Imprimir</span>
                        </button>
                        {ehLocal && (
                          <button
                            onClick={() => handleReabrir(comanda)}
                            className="px-4 py-3 bg-white text-stone-700 border border-stone-200 rounded-xl text-sm font-bold hover:bg-stone-50 shadow-sm transition-all text-center"
                            title="Reabrir comanda"
                          >
                            Reabrir
                          </button>
                        )}
                        <button
                          onClick={() => handleDispensar(comanda.id)}
                          className="flex-1 px-4 py-3 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-sm font-bold hover:bg-brand-100 shadow-sm transition-all text-center"
                          title="Tirar da tela"
                        >
                          Concluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dedicado da Comanda */}
      {comandaNoModal && isMounted && createPortal(
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setComandaModalId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-slideUp overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between gap-3 p-5 sm:p-6 bg-gradient-to-br from-white to-stone-50 border-b border-stone-100 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold font-display truncate text-stone-900 leading-none">
                    {comandaNoModal.nome_cliente || "Comanda Local"}
                  </h2>
                  {comandaNoModal.mesa_numero && (
                    <span className="shrink-0 px-2 py-0.5 bg-stone-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                      Mesa {comandaNoModal.mesa_numero}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-stone-500 font-medium truncate">Aberto em {formatDateTime(comandaNoModal.createdAt)}</p>
              </div>
              <button onClick={() => setComandaModalId(null)} className="text-stone-400 hover:text-stone-700 p-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl shadow-sm transition-all shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <Badge color={getTipoEntregaMeta(comandaNoModal.tipo_entrega).color}>{getTipoEntregaMeta(comandaNoModal.tipo_entrega).label}</Badge>
                <Badge color={comandaNoModal.pago ? "emerald" : "rose"}>{comandaNoModal.pago ? "Paga" : "Aberta"}</Badge>
              </div>

              <div className="mb-2">
                <h3 className="font-bold text-stone-800 text-[11px] uppercase tracking-wider mb-3 flex items-center gap-2">
                  Itens da Comanda <span className="h-px bg-stone-200 flex-1"></span>
                </h3>
                {(!comandaNoModal.PedidoItems || comandaNoModal.PedidoItems.length === 0) ? (
                  <div className="py-6 text-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                    <p className="text-sm text-stone-500">Nenhum item adicionado.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {comandaNoModal.PedidoItems.map((item) => (
                      <li key={item.id} className="flex justify-between items-center p-3 sm:p-4 bg-stone-50/80 border border-stone-100 shadow-sm rounded-xl text-sm transition-colors hover:bg-stone-100">
                        <span className="font-semibold text-stone-800 truncate pr-2">
                          {item.quantidade}x <span className="font-medium text-stone-600 ml-1">{item.Produto?.nome || "Produto"}</span>
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-stone-800 font-bold">{formatCurrency(parseFloat(item.preco_unitario) * parseFloat(item.quantidade))}</span>
                          {comandaNoModal.tipo_entrega === "Local" && !comandaNoModal.pago && (
                            <button onClick={() => handleRemoverItem(comandaNoModal, item.id)} className="text-stone-300 hover:text-rose-600 bg-white p-1.5 rounded-lg border border-stone-200 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {comandaNoModal.tipo_entrega === "Local" && !comandaNoModal.pago && (
                <button
                  onClick={() => setComandaParaAdicionarItem(comandaNoModal)}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-600 bg-white hover:text-brand-600 hover:bg-brand-50 border border-dashed border-stone-300 hover:border-brand-300 transition-all px-4 py-3 rounded-xl shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Adicionar mais itens
                </button>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="bg-stone-50 p-5 sm:p-6 border-t border-stone-200/60 shrink-0">
              <div className="flex justify-between text-sm text-stone-500 mb-1.5">
                <span className="font-medium">Subtotal</span>
                <span>{formatCurrency(comandaNoModal.subtotal)}</span>
              </div>
              <div className="flex justify-between items-end mb-5">
                <span className="text-base font-bold text-stone-800">Total da Comanda</span>
                <span className="text-3xl font-black font-display text-stone-900 leading-none">{formatCurrency(comandaNoModal.valor_total)}</span>
              </div>

              {!comandaNoModal.pago ? (
                <button
                  onClick={() => setComandaParaPagar(comandaNoModal)}
                  disabled={!comandaNoModal.PedidoItems || comandaNoModal.PedidoItems.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Wallet className="w-5 h-5" /> Realizar Pagamento
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => imprimirComanda(comandaNoModal, nomeLoja)}
                    className="flex-1 flex items-center justify-center gap-2 bg-stone-800 text-white py-3 px-4 rounded-xl font-bold text-sm hover:bg-stone-900 transition-all shadow-md hover:shadow-lg"
                  >
                    <Printer className="w-4 h-4 shrink-0" /> <span className="truncate">Imprimir Recibo</span>
                  </button>
                  {comandaNoModal.tipo_entrega === "Local" && (
                    <button
                      onClick={() => handleReabrir(comandaNoModal)}
                      className="px-4 py-3 bg-white text-stone-700 border border-stone-200 rounded-xl text-sm font-bold hover:bg-stone-50 shadow-sm transition-all text-center"
                      title="Reabrir comanda"
                    >
                      Reabrir
                    </button>
                  )}
                  <button
                    onClick={() => handleDispensar(comandaNoModal.id)}
                    className="flex-1 px-4 py-3 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-sm font-bold hover:bg-brand-100 shadow-sm transition-all text-center"
                    title="Tirar da tela"
                  >
                    Concluir Mesa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      <NovaComandaModal
        show={showNovaComanda}
        onClose={() => setShowNovaComanda(false)}
        onConfirm={handleAbrirComanda}
        mesasLivres={mesasLivres}
        salvando={abrindoComanda}
      />

      {/* AdicionarItem e Pagamento abrem por cima (z-[9999]) */}
      <AdicionarItemModal
        show={!!comandaParaAdicionarItem}
        onClose={() => setComandaParaAdicionarItem(null)}
        onConfirm={handleAdicionarItem}
        produtos={produtos}
        adicionando={adicionandoItem}
      />

      <PagamentoComandaModal
        show={!!comandaParaPagar}
        onClose={() => setComandaParaPagar(null)}
        comanda={comandaParaPagar}
        onGerarPix={handleGerarPix}
        onFinalizar={handleFinalizar}
        finalizando={finalizando}
      />
    </div>
  );
};

export default Comandas;