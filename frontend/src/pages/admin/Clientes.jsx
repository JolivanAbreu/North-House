import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Users, Search, ShoppingBag, MessageCircle, X, Star, AlertCircle, CalendarDays } from "lucide-react";
import api from "../../services/api.mjs";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { formatCurrency, formatDateTime, formatShortDate, buildWhatsappLink } from "../../utils/format.mjs";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (clienteSelecionado) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [clienteSelecionado]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const response = await api.get("/clientes");
        setClientes(response.data);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;
    const termo = busca.trim().toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome_cliente?.toLowerCase().includes(termo) ||
        c.telefone_cliente?.includes(termo)
    );
  }, [clientes, busca]);

  const abrirHistorico = async (cliente) => {
    setClienteSelecionado(cliente);
    setCarregandoHistorico(true);
    try {
      const chaveId = cliente.telefone_cliente || `sem-telefone-${cliente.nome_cliente}`;
      const response = await api.get(`/clientes/${encodeURIComponent(chaveId)}/pedidos`);
      setHistorico(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const modalHistorico = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={() => setClienteSelecionado(null)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col relative animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-stone-100 bg-white">
          <div>
            <h3 className="text-xl font-bold font-display text-stone-900">{clienteSelecionado?.nome_cliente}</h3>
            <p className="text-sm text-stone-500">{clienteSelecionado?.telefone_cliente || "Sem telefone"}</p>
          </div>
          <button
            onClick={() => setClienteSelecionado(null)}
            className="text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto bg-stone-50/50 flex-1">
          {carregandoHistorico ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-stone-100/80 rounded-2xl animate-pulse border border-stone-100" />
              ))}
            </div>
          ) : historico.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-6">Nenhum pedido encontrado.</p>
          ) : (
            <ul className="space-y-3">
              {historico.map((pedido) => (
                <li key={pedido.id} className="bg-white border border-stone-100 shadow-sm rounded-2xl p-4 transition-all hover:shadow-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-stone-800">Pedido #{pedido.id}</span>
                      <p className="text-xs text-stone-400 mt-0.5">{formatDateTime(pedido.createdAt)}</p>
                    </div>
                    <Badge color={pedido.status === "Cancelado" ? "rose" : pedido.status === "Concluído" ? "emerald" : "amber"}>
                      {pedido.status}
                    </Badge>
                  </div>
                  
                  <div className="bg-stone-50 rounded-xl p-3 my-3">
                    <ul className="text-sm text-stone-600 space-y-1.5">
                      {pedido.PedidoItems?.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span className="truncate pr-2">
                            {item.quantidade}x {item.Produto?.nome || "Produto removido"}
                          </span>
                          <span className="shrink-0 text-stone-400">{formatCurrency(item.preco_unitario)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total</span>
                    <span className="font-bold text-stone-900 text-lg">{formatCurrency(pedido.valor_total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn pb-16">
      <PageHeader
        title="Clientes"
        subtitle="Clientes de delivery e retirada (com telefone) aparecem aqui automaticamente."
      />

      <div className="relative max-w-md mb-6">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-stone-100 animate-pulse" />
          ))}
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Nenhum cliente ainda" description="Ao lançar um pedido de delivery ou retirada com telefone, o cliente aparece aqui." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {clientesFiltrados.map((cliente) => {
            const ticketMedio = cliente.totalPedidos > 0 ? (cliente.valorTotalGasto / cliente.totalPedidos) : 0;
            const isVip = cliente.totalPedidos >= 5;

            return (
              <Card key={cliente.telefone_cliente || cliente.nome_cliente} className="flex flex-col p-5 hover:shadow-lifted transition-shadow h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-bold font-display text-stone-900 text-lg truncate flex items-center gap-2">
                      {cliente.nome_cliente}
                    </h3>
                    <p className="text-sm text-stone-500 truncate">{cliente.telefone_cliente || "Sem telefone"}</p>
                  </div>
                  {isVip && (
                    <span className="shrink-0 bg-amber-100 text-amber-700 p-1.5 rounded-lg" title="Cliente Fiel (5+ pedidos)">
                      <Star className="w-4 h-4 fill-current" />
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <p className="text-xs text-stone-500 mb-0.5">Total Gasto</p>
                    <p className="font-bold text-stone-800">{formatCurrency(cliente.valorTotalGasto)}</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <p className="text-xs text-stone-500 mb-0.5">Ticket Médio</p>
                    <p className="font-bold text-stone-800">{formatCurrency(ticketMedio)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 mb-4 px-1">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" /> {cliente.totalPedidos} {cliente.totalPedidos === 1 ? 'pedido' : 'pedidos'}
                  </span>
                  <span className="flex items-center gap-1.5" title="Data do último pedido">
                    <CalendarDays className="w-3.5 h-3.5" /> {formatShortDate(cliente.ultimoPedidoEm)}
                  </span>
                </div>

                {cliente.pedidosCancelados > 0 && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 mb-4 px-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {cliente.pedidosCancelados} {cliente.pedidosCancelados === 1 ? 'pedido cancelado' : 'pedidos cancelados'}
                  </p>
                )}

                <div className="flex gap-2 mt-auto pt-4 border-t border-stone-100">
                  {cliente.telefone_cliente && (
                    <a
                      href={buildWhatsappLink(cliente.telefone_cliente, `Olá ${cliente.nome_cliente?.split(" ")[0]}!`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> Whats
                    </a>
                  )}
                  <button
                    onClick={() => abrirHistorico(cliente)}
                    className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" /> Histórico
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {clienteSelecionado && isMounted && createPortal(modalHistorico, document.body)}
    </div>
  );
};

export default Clientes;