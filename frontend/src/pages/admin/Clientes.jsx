import React, { useState, useEffect, useMemo } from "react";
import { Users, Search, ShoppingBag, MessageCircle, X } from "lucide-react";
import api from "../../services/api.mjs";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardBody } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { formatCurrency, formatDate, buildWhatsappLink } from "../../utils/format.mjs";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

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
      const response = await api.get(`/clientes/${cliente.telefone_cliente}/pedidos`);
      setHistorico(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Clientes" subtitle="Todo cliente que já fez um pedido pela sua vitrine aparece aqui automaticamente." />

      <div className="relative max-w-sm mb-6">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-stone-100 rounded-lg animate-pulse" />)}
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="Nenhum cliente ainda" description="Assim que alguém fizer um pedido pela vitrine, ele aparece aqui." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                    <th className="text-left p-4">Cliente</th>
                    <th className="text-left p-4">Telefone</th>
                    <th className="text-left p-4">Pedidos</th>
                    <th className="text-left p-4">Total gasto</th>
                    <th className="text-left p-4">Último pedido</th>
                    <th className="text-right p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.telefone_cliente || cliente.nome_cliente} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="p-4 font-medium text-stone-800">{cliente.nome_cliente}</td>
                      <td className="p-4 text-stone-600">{cliente.telefone_cliente || "—"}</td>
                      <td className="p-4 text-stone-600">{cliente.totalPedidos}</td>
                      <td className="p-4 text-stone-800 font-semibold">{formatCurrency(cliente.valorTotalGasto)}</td>
                      <td className="p-4 text-stone-500">{formatDate(cliente.ultimoPedidoEm)}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          {cliente.telefone_cliente && (
                            <a
                              href={buildWhatsappLink(cliente.telefone_cliente, `Olá ${cliente.nome_cliente?.split(" ")[0]}!`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Chamar no WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => abrirHistorico(cliente)}
                            className="p-2 text-stone-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Ver histórico de pedidos"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {clienteSelecionado && (
        <div className="fixed inset-0 z-40 overflow-y-auto p-4" onClick={() => setClienteSelecionado(null)}>
          <div className="min-h-full flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lifted max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-5 border-b border-stone-100 sticky top-0 bg-white">
                <div>
                  <h3 className="text-lg font-bold font-display">{clienteSelecionado.nome_cliente}</h3>
                  <p className="text-xs text-stone-500">{clienteSelecionado.telefone_cliente}</p>
                </div>
                <button onClick={() => setClienteSelecionado(null)} className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                {carregandoHistorico ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-stone-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : historico.length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-6">Nenhum pedido encontrado.</p>
                ) : (
                  <ul className="space-y-3">
                    {historico.map((pedido) => (
                      <li key={pedido.id} className="border border-stone-100 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm text-stone-800">Pedido #{pedido.id}</span>
                          <span className="text-xs text-stone-500">{formatDate(pedido.createdAt)}</span>
                        </div>
                        <p className="text-xs text-stone-500 mb-2">{pedido.status}</p>
                        <ul className="text-xs text-stone-600 space-y-0.5">
                          {pedido.PedidoItems?.map((item) => (
                            <li key={item.id}>
                              {item.quantidade}x {item.Produto?.nome || "Produto removido"}
                            </li>
                          ))}
                        </ul>
                        <p className="text-right font-semibold text-sm text-stone-800 mt-2">{formatCurrency(pedido.valor_total)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
