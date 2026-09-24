import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, ShoppingBag, Printer, Wallet, Trash2, ChevronUp } from "lucide-react";
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
  if (pedido.tipo_entrega === "Local") return true; // fica na tela até o staff dispensar, mesmo já paga
  return !["Concluído", "Cancelado"].includes(pedido.status);
};

const Comandas = () => {
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [nomeLoja, setNomeLoja] = useState("Loja");
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("Todas");

  const [showNovaComanda, setShowNovaComanda] = useState(false);
  const [abrindoComanda, setAbrindoComanda] = useState(false);

  const [comandaParaAdicionarItem, setComandaParaAdicionarItem] = useState(null);
  const [adicionandoItem, setAdicionandoItem] = useState(false);

  const [comandaParaPagar, setComandaParaPagar] = useState(null);
  const [finalizando, setFinalizando] = useState(false);

  const [comandaExpandidaId, setComandaExpandidaId] = useState(null);

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

  // --- Nova comanda ---
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

  // --- Adicionar item (Com soma de quantidade se já existir) ---
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

  // --- Pagamento ---
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-stone-100 animate-pulse" />
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
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-soft"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroTipo === f.value ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {comandasAtivas.length === 0 ? (
        <Card><EmptyState icon={ShoppingBag} title="Nenhuma comanda em andamento" description="Abra uma nova comanda local ou aguarde novos pedidos de delivery." /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
          {comandasAtivas.map((comanda) => {
            const tipoMeta = getTipoEntregaMeta(comanda.tipo_entrega);
            const expandida = comanda.id === comandaExpandidaId;

            if (!expandida) {
              return (
                <button
                  key={comanda.id}
                  type="button"
                  onClick={() => setComandaExpandidaId(comanda.id)}
                  className={`w-full text-left bg-white rounded-2xl border border-stone-100 ${tipoMeta.borderClass} p-4 shadow-card hover:shadow-lifted hover:-translate-y-0.5 transition-all duration-150`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm text-stone-800 truncate pr-2">
                      {comanda.nome_cliente || "Comanda Local"}
                    </p>
                    <Badge color={tipoMeta.color}>{tipoMeta.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-stone-500">
                      {comanda.mesa_numero ? `Mesa ${comanda.mesa_numero}` : "Balcão"}
                    </span>
                    <Badge color={comanda.pago ? "emerald" : "rose"}>{comanda.pago ? "Paga" : "Aberta"}</Badge>
                  </div>
                </button>
              );
            }

            const ehLocal = comanda.tipo_entrega === "Local";

            return (
              <div
                key={comanda.id}
                className={`w-full bg-white rounded-2xl border border-stone-100 shadow-lifted animate-fadeIn ${tipoMeta.borderClass}`}
              >
                <button
                  type="button"
                  onClick={() => setComandaExpandidaId(null)}
                  className="w-full flex items-start justify-between gap-2 p-4 pb-0 text-left"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold font-display truncate">
                        {comanda.nome_cliente || "Comanda Local"}
                      </h2>
                      {comanda.mesa_numero && (
                        <span className="shrink-0 px-2 py-0.5 bg-stone-100 text-stone-600 text-xs font-bold rounded-md">
                          Mesa {comanda.mesa_numero}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 truncate">{formatDateTime(comanda.createdAt)}</p>
                  </div>
                  <span className="text-stone-500 hover:text-stone-800 p-1 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors shrink-0">
                    <ChevronUp className="w-5 h-5" />
                  </span>
                </button>

                <div className="p-4 pt-3">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge color={tipoMeta.color}>{tipoMeta.label}</Badge>
                    <Badge color={comanda.pago ? "emerald" : "rose"}>{comanda.pago ? "Paga" : "Aberta"}</Badge>
                  </div>

                  <div className="mb-3">
                    <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wide mb-1.5">Itens</h3>
                    {(!comanda.PedidoItems || comanda.PedidoItems.length === 0) ? (
                      <p className="text-xs text-stone-400 py-2">Nenhum item ainda.</p>
                    ) : (
                      <ul className="space-y-1.5 max-h-[135px] overflow-y-auto pr-1">
                        {comanda.PedidoItems.map((item) => (
                          <li key={item.id} className="flex justify-between items-center p-2.5 bg-stone-50 border border-stone-100 rounded-xl text-xs">
                            <span className="font-medium text-stone-700 truncate pr-2">
                              {item.Produto?.nome || "Produto"} <span className="text-stone-500 font-normal">x{formatQuantidade(item.quantidade)}</span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-stone-700 font-semibold">{formatCurrency(parseFloat(item.preco_unitario) * parseFloat(item.quantidade))}</span>
                              {ehLocal && !comanda.pago && (
                                <button onClick={() => handleRemoverItem(comanda, item.id)} className="text-stone-300 hover:text-rose-600 bg-white p-1 rounded-md shadow-sm transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {ehLocal && !comanda.pago && (
                    <button
                      onClick={() => setComandaParaAdicionarItem(comanda)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-100 transition-colors px-3 py-1.5 rounded-lg mb-4"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar item
                    </button>
                  )}

                  <div className="border-t border-stone-100 pt-3">
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>Subtotal</span>
                      <span>{formatCurrency(comanda.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-baseline mb-4">
                      <span className="text-sm font-semibold text-stone-700">Total</span>
                      <span className="text-xl font-bold font-display text-stone-900">{formatCurrency(comanda.valor_total)}</span>
                    </div>

                    {!comanda.pago ? (
                      <button
                        onClick={() => setComandaParaPagar(comanda)}
                        disabled={!comanda.PedidoItems || comanda.PedidoItems.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-soft disabled:bg-stone-300 disabled:shadow-none"
                      >
                        <Wallet className="w-4 h-4" /> Pagar comanda
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => imprimirComanda(comanda, nomeLoja)}
                          className="flex-1 flex items-center justify-center gap-2 bg-stone-800 text-white py-2.5 px-3 rounded-xl font-semibold text-sm hover:bg-stone-900 transition-colors"
                        >
                          <Printer className="w-4 h-4 shrink-0" /> <span className="truncate">Imprimir</span>
                        </button>
                        {ehLocal && (
                          <button
                            onClick={() => handleReabrir(comanda)}
                            className="flex-1 min-w-[80px] px-3 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-200 transition-colors text-center"
                            title="Reabrir comanda"
                          >
                            Reabrir
                          </button>
                        )}
                        <button
                          onClick={() => handleDispensar(comanda.id)}
                          className="flex-1 min-w-[80px] px-3 py-2.5 bg-brand-50 text-brand-700 rounded-xl text-sm font-semibold hover:bg-brand-100 transition-colors text-center"
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

      <NovaComandaModal
        show={showNovaComanda}
        onClose={() => setShowNovaComanda(false)}
        onConfirm={handleAbrirComanda}
        mesasLivres={mesasLivres}
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

export default Comandas;