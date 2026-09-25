import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Minus, ShoppingBag, Printer, Wallet, Trash2, X, Search, Clock,
  Phone, MapPin, RotateCcw, CheckCheck, RefreshCw, ChevronUp, Maximize2
} from "lucide-react";
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
  getOrigemComanda, tempoDecorrido,
} from "../../utils/format.mjs";
import { imprimirComanda } from "../../utils/impressao.mjs";
import useTravarScroll from "../../hooks/useTravarScroll.mjs";
import { formatarTelefone } from "../../utils/mascaras.mjs";

const FILTROS_TIPO = [
  { value: "Todas", label: "Todas" },
  { value: "Local", label: "Locais" },
  { value: "Delivery", label: "Delivery" },
  { value: "Retirada", label: "Retirada" },
];

const INTERVALO_ATUALIZACAO_MS = 30000;

const ehComandaAtiva = (pedido, recemPagas) => {
  if (recemPagas.has(pedido.id)) return true;
  if (pedido.arquivado_em) return false;
  if (pedido.pago) return false;
  return !["Concluído", "Cancelado"].includes(pedido.status);
};

const nomeDaComanda = (comanda) =>
  comanda.nome_cliente && comanda.nome_cliente !== "Comanda Local"
    ? comanda.nome_cliente
    : comanda.tipo_entrega === "Local" ? "Balcão" : "Cliente";

const Comandas = () => {
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [, setTick] = useState(0); 

  const [showNovaComanda, setShowNovaComanda] = useState(false);
  const [mesaPreSelecionada, setMesaPreSelecionada] = useState("");
  const [abrindoComanda, setAbrindoComanda] = useState(false);

  const [comandaParaAdicionarItem, setComandaParaAdicionarItem] = useState(null);
  const [adicionandoItem, setAdicionandoItem] = useState(false);

  const [comandaParaPagar, setComandaParaPagar] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [recemPagas, setRecemPagas] = useState(() => new Set());

  // Estados de visualização da comanda
  const [comandaAbertaId, setComandaAbertaId] = useState(null); // Modal dedicado
  const [comandaExpandidaId, setComandaExpandidaId] = useState(null); // Inline expand
  const [itemAlterando, setItemAlterando] = useState(null);

  const buscaRef = useRef(null);

  useTravarScroll(!!comandaAbertaId);

  const fetchTudo = useCallback(async ({ silencioso = false } = {}) => {
    try {
      if (silencioso) setAtualizando(true);
      else setLoading(true);
      const [resPedidos, resMesas, resProdutos, resPerfil] = await Promise.all([
        api.get("/pedidos/admin"),
        api.get("/mesas"),
        api.get("/produtos"),
        api.get("/perfil"),
      ]);
      setPedidos(resPedidos.data);
      setMesas(resMesas.data);
      setProdutos(resProdutos.data);
      setPerfil(resPerfil.data || null);
    } catch (error) {
      console.error("Erro ao carregar tela de comandas:", error);
      if (!silencioso) toast.error("Erro ao carregar comandas.");
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    fetchTudo();
  }, [fetchTudo]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchTudo({ silencioso: true });
      setTick((t) => t + 1);
    }, INTERVALO_ATUALIZACAO_MS);
    const onFocus = () => fetchTudo({ silencioso: true });
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchTudo]);

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (comandaAbertaId || showNovaComanda || comandaParaAdicionarItem || comandaParaPagar) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setMesaPreSelecionada("");
        setShowNovaComanda(true);
      } else if (e.key === "/") {
        e.preventDefault();
        buscaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [comandaAbertaId, showNovaComanda, comandaParaAdicionarItem, comandaParaPagar]);

  const todasAtivas = useMemo(
    () => pedidos.filter((p) => ehComandaAtiva(p, recemPagas)),
    [pedidos, recemPagas],
  );

  const comandasVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return todasAtivas
      .filter((p) => filtroTipo === "Todas" || p.tipo_entrega === filtroTipo)
      .filter((p) =>
        !termo ||
        (p.nome_cliente || "").toLowerCase().includes(termo) ||
        (p.mesa_numero && `mesa ${p.mesa_numero}`.includes(termo)) ||
        String(p.mesa_numero || "") === termo,
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [todasAtivas, filtroTipo, busca]);

  const resumo = useMemo(() => {
    const abertas = todasAtivas.filter((p) => !p.pago);
    return {
      locais: abertas.filter((p) => p.tipo_entrega === "Local").length,
      externas: abertas.filter((p) => p.tipo_entrega !== "Local").length,
      emAberto: abertas.reduce((soma, p) => soma + (parseFloat(p.valor_total) || 0), 0),
      mesasOcupadas: mesas.filter((m) => m.status === "ocupada").length,
    };
  }, [todasAtivas, mesas]);

  const mesasLivres = useMemo(() => mesas.filter((m) => m.status === "livre"), [mesas]);

  const comandaAberta = useMemo(
    () => pedidos.find((c) => c.id === comandaAbertaId) || null,
    [pedidos, comandaAbertaId],
  );

  const substituirPedido = (atualizado) => {
    if (!atualizado?.id) return;
    setPedidos((prev) => prev.map((p) => (p.id === atualizado.id ? { ...p, ...atualizado } : p)));
  };

  const abrirNovaComanda = (mesaId = "") => {
    setMesaPreSelecionada(mesaId ? String(mesaId) : "");
    setShowNovaComanda(true);
  };

  const handleAbrirComanda = async (dados) => {
    setAbrindoComanda(true);
    try {
      const response = await api.post("/pedidos/admin", dados);
      setPedidos((prev) => [response.data, ...prev]);
      setShowNovaComanda(false);
      toast.success("Comanda aberta! Agora adicione os itens.");
      setComandaAbertaId(response.data.id);
      setComandaParaAdicionarItem(response.data);
      fetchTudo({ silencioso: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao abrir comanda.");
    } finally {
      setAbrindoComanda(false);
    }
  };

  const handleAdicionarItem = async ({ produtoId, quantidade }) => {
    if (!comandaParaAdicionarItem) return false;
    setAdicionandoItem(true);
    try {
      const comandaAtual = pedidos.find((p) => p.id === comandaParaAdicionarItem.id) || comandaParaAdicionarItem;
      const itemExistente = comandaAtual.PedidoItems?.find(
        (item) => String(item.Produto?.id || item.ProdutoId) === String(produtoId) && !item.variacao_nome,
      );

      let response;
      if (itemExistente) {
        const novaQuantidade = parseFloat(itemExistente.quantidade) + parseFloat(quantidade);
        response = await api.put(`/pedidos/admin/${comandaAtual.id}/itens/${itemExistente.id}`, {
          quantidade: novaQuantidade,
        });
      } else {
        response = await api.post(`/pedidos/admin/${comandaAtual.id}/itens`, { produtoId, quantidade });
      }
      substituirPedido(response.data);
      toast.success(itemExistente ? "Quantidade atualizada!" : "Item adicionado!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao adicionar item.");
      return false;
    } finally {
      setAdicionandoItem(false);
    }
  };

  const handleAlterarQuantidade = async (comanda, item, delta) => {
    const produto = produtos.find((p) => p.id === (item.Produto?.id || item.ProdutoId));
    const passo = produto?.unidade_venda === "kg" ? 0.1 : 1;
    const nova = parseFloat((parseFloat(item.quantidade) + delta * passo).toFixed(3));
    if (nova <= 0) {
      handleRemoverItem(comanda, item.id);
      return;
    }
    setItemAlterando(item.id);
    try {
      const response = await api.put(`/pedidos/admin/${comanda.id}/itens/${item.id}`, { quantidade: nova });
      substituirPedido(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao alterar quantidade.");
    } finally {
      setItemAlterando(null);
    }
  };

  const handleRemoverItem = async (comanda, itemId) => {
    setItemAlterando(itemId);
    try {
      const response = await api.delete(`/pedidos/admin/${comanda.id}/itens/${itemId}`);
      if (response.data?.id) substituirPedido(response.data);
      else await fetchTudo({ silencioso: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao remover item.");
    } finally {
      setItemAlterando(null);
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
      setRecemPagas((prev) => new Set(prev).add(comandaId));
      substituirPedido(response.data);
      setMesas((prev) => prev.map((m) => (m.id === response.data.MesaId ? { ...m, status: "livre" } : m)));
      setComandaParaPagar(null);
      setComandaAbertaId(comandaId);
      toast.success("Pagamento confirmado! Imprima o comprovante se precisar.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao finalizar comanda.");
    } finally {
      setFinalizando(false);
    }
  };

  const handleConcluir = (comandaId) => {
    setRecemPagas((prev) => {
      const novo = new Set(prev);
      novo.delete(comandaId);
      return novo;
    });
    if (comandaAbertaId === comandaId) setComandaAbertaId(null);
    if (comandaExpandidaId === comandaId) setComandaExpandidaId(null);
    toast.success("Comanda enviada para o relatório do dia.");
  };

  const handleReabrir = async (comanda) => {
    try {
      await api.put(`/pedidos/admin/${comanda.id}/reabrir`);
      setRecemPagas((prev) => {
        const novo = new Set(prev);
        novo.delete(comanda.id);
        return novo;
      });
      toast.success("Comanda reaberta.");
      await fetchTudo({ silencioso: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao reabrir comanda.");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Comandas" />
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-stone-100 animate-pulse break-inside-avoid mb-3" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn pb-16">
      <PageHeader
        title="Comandas"
        subtitle={
          <span className="inline-flex items-center gap-2">
            {resumo.locais + resumo.externas} em aberto
            <button
              onClick={() => fetchTudo({ silencioso: true })}
              className="text-stone-400 hover:text-stone-700 transition-colors"
              title="Atualizar agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${atualizando ? "animate-spin" : ""}`} />
            </button>
          </span>
        }
        action={
          <button
            onClick={() => abrirNovaComanda()}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-soft"
            title="Atalho: tecla N"
          >
            <Plus className="w-4 h-4" /> Nova comanda
            <kbd className="hidden md:inline ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-white/20 rounded">N</kbd>
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <ResumoTile label="Comandas locais" valor={resumo.locais} cor="text-violet-700" />
        <ResumoTile label="Delivery / retirada" valor={resumo.externas} cor="text-amber-700" />
        <ResumoTile label="Total em aberto" valor={formatCurrency(resumo.emAberto)} cor="text-stone-900" />
        <ResumoTile label="Mesas ocupadas" valor={`${resumo.mesasOcupadas}/${mesas.length}`} cor="text-rose-700" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
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
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={buscaRef}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente ou mesa  ( / )"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      {comandasVisiveis.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title={busca ? "Nenhuma comanda encontrada" : "Nenhuma comanda em aberto"}
            description={busca ? "Confira o nome ou o número da mesa." : "Clique em \"Nova comanda\" (ou tecle N) para atender um cliente."}
          />
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
          {comandasVisiveis.map((comanda) => {
            const expandida = comanda.id === comandaExpandidaId;
            const tipoMeta = getTipoEntregaMeta(comanda.tipo_entrega);
            const origem = getOrigemComanda(comanda.PedidoItems);
            const ehLocal = comanda.tipo_entrega === "Local";
            const itens = comanda.PedidoItems || [];
            const podeEditar = !comanda.pago;

            if (!expandida) {
              return (
                <div key={comanda.id} className="break-inside-avoid mb-3">
                  <button
                    type="button"
                    onClick={() => setComandaExpandidaId(comanda.id)}
                    className={`w-full text-left rounded-2xl border border-stone-200/60 p-4 shadow-sm hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 min-w-0 bg-white border-l-4 ${tipoMeta.borderClass.replace('border-l-4', '')}`}
                  >
                    <h3 className="font-bold text-[15px] text-stone-900 truncate w-full leading-tight">
                      {nomeDaComanda(comanda)}
                    </h3>
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-xs text-stone-500 font-semibold truncate">
                        {ehLocal ? (comanda.mesa_numero ? `Mesa ${comanda.mesa_numero}` : "Sem mesa") : tipoMeta.label}
                      </span>
                      {comanda.pago ? (
                        <Badge color="emerald">Pago</Badge>
                      ) : (
                        <Badge color="rose">Aberto</Badge>
                      )}
                    </div>
                  </button>
                </div>
              );
            }

            return (
              <div key={comanda.id} className="break-inside-avoid mb-3">
                <div className={`w-full bg-white rounded-3xl border border-stone-200/60 shadow-xl overflow-hidden animate-fadeIn flex flex-col border-t-4 ${tipoMeta.borderClass.replace('border-l-4', '').replace('border-l-', 'border-t-')}`}>
                  {/* Cabeçalho Inline */}
                  <div
                    onClick={() => setComandaExpandidaId(null)}
                    className="w-full flex items-start justify-between gap-3 p-4 sm:p-5 bg-gradient-to-br from-white to-stone-50 border-b border-stone-100 cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h2 className="text-xl font-bold font-display truncate text-stone-900 leading-none">
                          {nomeDaComanda(comanda)}
                        </h2>
                        {comanda.mesa_numero && (
                          <span className="shrink-0 px-2 py-0.5 bg-stone-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                            Mesa {comanda.mesa_numero}
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-stone-500 font-medium truncate mt-2">
                        <Clock className="w-3.5 h-3.5" /> Aberta em {formatDateTime(comanda.createdAt)} · {tempoDecorrido(comanda.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setComandaAbertaId(comanda.id); setComandaExpandidaId(null); }}
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

                  {/* Corpo Inline */}
                  <div className="p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color={tipoMeta.color}>{tipoMeta.label}</Badge>
                      {origem && <Badge color={origem.color}>{origem.label}</Badge>}
                      <Badge color={comanda.pago ? "emerald" : "rose"}>{comanda.pago ? "Pago" : "Aberto"}</Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-800 text-[11px] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        Itens da Comanda <span className="h-px bg-stone-200 flex-1"></span>
                      </h3>
                      {(!itens || itens.length === 0) ? (
                        <div className="py-4 text-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                          <p className="text-sm text-stone-500">Nenhum item adicionado.</p>
                        </div>
                      ) : (
                        <ul className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {itens.map((item) => {
                            const totalItem = parseFloat(item.preco_unitario) * parseFloat(item.quantidade);
                            const ocupado = itemAlterando === item.id;
                            return (
                              <li key={item.id} className={`flex items-center justify-between p-2.5 bg-stone-50/80 border border-stone-100 shadow-sm rounded-xl text-sm transition-colors hover:bg-stone-100 ${ocupado ? "opacity-50" : ""}`}>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-stone-800 truncate">
                                    {item.Produto?.nome || "Produto"}
                                    {item.variacao_nome && <span className="text-stone-500 font-normal"> ({item.variacao_nome})</span>}
                                  </p>
                                  <p className="text-xs text-stone-400">
                                    {formatQuantidade(item.quantidade)} × {formatCurrency(item.preco_unitario)}
                                  </p>
                                </div>
                                {podeEditar && (
                                  <div className="flex items-center gap-1 shrink-0 mx-2">
                                    <button disabled={ocupado} onClick={() => handleAlterarQuantidade(comanda, item, -1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"><Minus className="w-3 h-3" /></button>
                                    <button disabled={ocupado} onClick={() => handleAlterarQuantidade(comanda, item, 1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"><Plus className="w-3 h-3" /></button>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-stone-800 font-bold tabular-nums">{formatCurrency(totalItem)}</span>
                                  {podeEditar && (
                                    <button disabled={ocupado} onClick={() => handleRemoverItem(comanda, item.id)} className="text-stone-300 hover:text-rose-600 bg-white p-1.5 rounded-lg border border-stone-200 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {podeEditar && (
                        <button
                          onClick={() => setComandaParaAdicionarItem(comanda)}
                          className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-600 bg-white hover:text-brand-600 hover:bg-brand-50 border border-dashed border-stone-300 hover:border-brand-300 transition-all px-3 py-2.5 rounded-xl shadow-sm"
                        >
                          <Plus className="w-4 h-4" /> Adicionar item
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rodapé Inline */}
                  <div className="bg-stone-50 p-4 sm:p-5 border-t border-stone-200/60 mt-auto">
                    <div className="flex justify-between items-center text-sm text-stone-500 mb-1.5">
                      <span className="font-medium">Subtotal</span>
                      <span className="tabular-nums">{formatCurrency(comanda.subtotal)}</span>
                    </div>
                    {parseFloat(comanda.valor_desconto || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm text-emerald-600 mb-1.5">
                        <span className="font-medium">Desconto</span>
                        <span className="tabular-nums">- {formatCurrency(comanda.valor_desconto)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-sm font-bold text-stone-800">Total</span>
                      <span className="text-2xl font-black font-display text-stone-900 leading-none tabular-nums">{formatCurrency(comanda.valor_total)}</span>
                    </div>

                    {!comanda.pago ? (
                      <button
                        onClick={() => setComandaParaPagar(comanda)}
                        disabled={!itens || itens.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none disabled:cursor-not-allowed"
                      >
                        <Wallet className="w-4 h-4" /> Pagar comanda
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => imprimirComanda(comanda, perfil)}
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
                          onClick={() => handleConcluir(comanda.id)}
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

      {comandaAberta && createPortal(
        <ComandaDetalhe
          comanda={comandaAberta}
          itemAlterando={itemAlterando}
          onFechar={() => setComandaAbertaId(null)}
          onAdicionarItem={() => setComandaParaAdicionarItem(comandaAberta)}
          onAlterarQuantidade={handleAlterarQuantidade}
          onRemoverItem={handleRemoverItem}
          onPagar={() => setComandaParaPagar(comandaAberta)}
          onImprimir={() => imprimirComanda(comandaAberta, perfil)}
          onReabrir={() => handleReabrir(comandaAberta)}
          onConcluir={() => handleConcluir(comandaAberta.id)}
        />,
        document.body,
      )}

      <NovaComandaModal
        key={showNovaComanda ? `nova-${mesaPreSelecionada}` : "fechado"}
        show={showNovaComanda}
        onClose={() => setShowNovaComanda(false)}
        onConfirm={handleAbrirComanda}
        mesasLivres={mesasLivres}
        mesaInicial={mesaPreSelecionada}
        salvando={abrindoComanda}
      />

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

const ResumoTile = ({ label, valor, cor }) => (
  <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
    <p className={`text-xl font-bold font-display mt-0.5 tabular-nums ${cor}`}>{valor}</p>
  </div>
);

const ComandaDetalhe = ({
  comanda, itemAlterando, onFechar, onAdicionarItem, onAlterarQuantidade,
  onRemoverItem, onPagar, onImprimir, onReabrir, onConcluir,
}) => {
  const tipoMeta = getTipoEntregaMeta(comanda.tipo_entrega);
  const origem = getOrigemComanda(comanda.PedidoItems);
  const ehLocal = comanda.tipo_entrega === "Local";
  const itens = comanda.PedidoItems || [];
  const podeEditar = !comanda.pago;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onFechar}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] animate-slideUp overflow-hidden border-t-8 ${tipoMeta.topoClass || tipoMeta.borderClass.replace('border-l-4', '').replace('border-l-', 'border-t-')}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-stone-100 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display truncate text-stone-900 leading-none">
                {nomeDaComanda(comanda)}
              </h2>
              {comanda.mesa_numero && (
                <span className="shrink-0 px-2 py-0.5 bg-stone-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-md">
                  Mesa {comanda.mesa_numero}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge color={tipoMeta.color}>{tipoMeta.label}</Badge>
              {origem && <Badge color={origem.color}>{origem.label}</Badge>}
              <Badge color={comanda.pago ? "emerald" : "rose"}>{comanda.pago ? "Pago" : "Aberto"}</Badge>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mt-2">
              <Clock className="w-3.5 h-3.5" />
              Aberta em {formatDateTime(comanda.createdAt)} · {tempoDecorrido(comanda.createdAt)}
            </p>
            {!ehLocal && (comanda.telefone_cliente || comanda.endereco_entrega) && (
              <div className="mt-2 space-y-1 text-xs text-stone-600">
                {comanda.telefone_cliente && (
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-stone-400" /> {formatarTelefone(comanda.telefone_cliente)}</p>
                )}
                {comanda.endereco_entrega && (
                  <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" /> {comanda.endereco_entrega}</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onFechar}
            className="text-stone-400 hover:text-stone-700 p-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl shadow-sm transition-all shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <h3 className="font-bold text-stone-800 text-[11px] uppercase tracking-wider mb-3 flex items-center gap-2">
            Itens <span className="text-stone-400">({itens.length})</span> <span className="h-px bg-stone-200 flex-1" />
          </h3>
          {itens.length === 0 ? (
            <div className="py-6 text-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
              <p className="text-sm text-stone-500">Nenhum item adicionado.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {itens.map((item) => {
                const totalItem = parseFloat(item.preco_unitario) * parseFloat(item.quantidade);
                const ocupado = itemAlterando === item.id;
                return (
                  <li
                    key={item.id}
                    className={`flex items-center gap-3 p-3 bg-stone-50/80 border border-stone-100 rounded-xl text-sm ${ocupado ? "opacity-50" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-800 truncate">
                        {item.Produto?.nome || "Produto"}
                        {item.variacao_nome && <span className="text-stone-500 font-normal"> ({item.variacao_nome})</span>}
                      </p>
                      <p className="text-xs text-stone-400">
                        {formatQuantidade(item.quantidade)} × {formatCurrency(item.preco_unitario)}
                      </p>
                    </div>
                    {podeEditar && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={ocupado}
                          onClick={() => onAlterarQuantidade(comanda, item, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={ocupado}
                          onClick={() => onAlterarQuantidade(comanda, item, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <span className="text-stone-900 font-bold w-20 text-right shrink-0 tabular-nums">{formatCurrency(totalItem)}</span>
                    {podeEditar && (
                      <button
                        disabled={ocupado}
                        onClick={() => onRemoverItem(comanda, item.id)}
                        className="text-stone-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                        aria-label="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {podeEditar && (
            <button
              onClick={onAdicionarItem}
              className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-600 bg-white hover:text-brand-600 hover:bg-brand-50 border border-dashed border-stone-300 hover:border-brand-300 transition-all px-4 py-3 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Adicionar itens
            </button>
          )}
        </div>

        <div className="bg-stone-50 p-5 sm:p-6 border-t border-stone-200/60 shrink-0">
          <div className="flex justify-between text-sm text-stone-500 mb-1.5">
            <span className="font-medium">Subtotal</span>
            <span className="tabular-nums">{formatCurrency(comanda.subtotal)}</span>
          </div>
          {parseFloat(comanda.valor_desconto || 0) > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 mb-1.5">
              <span className="font-medium">Desconto</span>
              <span className="tabular-nums">- {formatCurrency(comanda.valor_desconto)}</span>
            </div>
          )}
          <div className="flex justify-between items-end mb-5">
            <span className="text-base font-bold text-stone-800">Total</span>
            <span className="text-3xl font-black font-display text-stone-900 leading-none tabular-nums">
              {formatCurrency(comanda.valor_total)}
            </span>
          </div>

          {!comanda.pago ? (
            <button
              onClick={onPagar}
              disabled={itens.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition-all shadow-md disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Wallet className="w-5 h-5" /> Pagar
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-stone-500">
                Pago via <strong>{comanda.forma_pagamento_ilustrativa || "-"}</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onImprimir}
                  className="flex-1 flex items-center justify-center gap-2 whitespace-nowrap bg-stone-800 text-white py-3 px-4 rounded-xl font-bold text-sm hover:bg-stone-900 transition-all"
                  title="Abre a impressão — escolha a impressora térmica ou 'Salvar como PDF'"
                >
                  <Printer className="w-4 h-4 shrink-0" /> Imprimir
                </button>
                <button
                  onClick={onReabrir}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-white text-stone-700 border border-stone-200 rounded-xl text-sm font-bold hover:bg-stone-50 transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Reabrir
                </button>
                <button
                  onClick={onConcluir}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-sm font-bold hover:bg-brand-100 transition-all"
                >
                  <CheckCheck className="w-4 h-4" /> Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comandas;