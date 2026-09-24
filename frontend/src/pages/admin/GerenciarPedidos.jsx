import React, { useState, useEffect, useMemo } from "react";
import { Search, MessageCircle, ClipboardList, AlertTriangle, CheckSquare, Square, X, Trash2, Archive, ArchiveRestore, MapPin } from "lucide-react";
import api from "../../services/api.mjs";
import toast from "react-hot-toast";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import { formatCurrency, formatDateTime, getStatusMeta, buildWhatsappLink, getTipoEntregaMeta, getOrigemComanda } from "../../utils/format.mjs";

const getStatusOptions = (tipoEntrega) => {
  const options = ["Recebido", "Em preparo"];
  options.push(tipoEntrega === "Retirada" ? "Pronto para retirada" : "Pronto para entrega");
  options.push("Concluído");
  options.push("Cancelado");
  return options;
};

const TODOS_STATUS = ["Recebido", "Em preparo", "Pronto para entrega", "Pronto para retirada", "Concluído", "Cancelado"];
const STATUS_FINAIS = ["Concluído", "Cancelado"];
const FILTROS = ["Todos", ...TODOS_STATUS];
const PAGE_SIZE = 9;

const buildNotifyMessage = (pedido, statusParaMensagem) => {
  const statusFrases = {
    "Recebido": "recebemos o seu pedido e já vamos começar a preparar!",
    "Em preparo": "o seu pedido já está a ser preparado.",
    "Pronto para entrega": "o seu pedido está pronto e sairá para entrega em breve!",
    "Pronto para retirada": "o seu pedido está pronto para retirada!",
    "Concluído": "o seu pedido foi concluído. Obrigado pela preferência!",
    "Cancelado": "infelizmente o seu pedido foi cancelado. Entre em contacto para mais detalhes.",
  };
  const frase = statusFrases[statusParaMensagem] || "há uma atualização no seu pedido.";
  return `Olá ${pedido.nome_cliente.split(" ")[0]}! Sobre o seu pedido #${pedido.id}: ${frase}`;
};

const GerenciarPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [errosPorPedido, setErrosPorPedido] = useState({});
  const [selecionados, setSelecionados] = useState([]);
  const [aplicandoLote, setAplicandoLote] = useState(false);
  const [statusLote, setStatusLote] = useState("Em preparo");
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState(null);

  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await api.get("/pedidos/admin?incluirArquivados=true");
      setPedidos(response.data);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArquivar = async (pedido) => {
    try {
      await api.put(`/pedidos/admin/${pedido.id}/arquivar`);
      setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, arquivado_em: new Date().toISOString() } : p)));
      toast.success(`Pedido #${pedido.id} arquivado manualmente.`);
    } catch (error) {
      console.error("Erro ao arquivar pedido:", error);
      toast.error("Erro ao arquivar pedido.");
    }
  };

  const handleDesarquivar = async (pedido) => {
    try {
      await api.put(`/pedidos/admin/${pedido.id}/desarquivar`);
      setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, arquivado_em: null } : p)));
      toast.success(`Pedido #${pedido.id} voltou para a lista principal.`);
    } catch (error) {
      console.error("Erro ao desarquivar pedido:", error);
      toast.error("Erro ao desarquivar pedido.");
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    let lista = pedidos.filter((p) => Boolean(p.arquivado_em) === mostrarArquivados);
    if (filtroStatus !== "Todos") {
      lista = lista.filter((p) => p.status === filtroStatus);
    }
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter(
        (p) => p.nome_cliente.toLowerCase().includes(termo) || String(p.id).includes(termo)
      );
    }
    return lista;
  }, [pedidos, filtroStatus, busca, mostrarArquivados]);

  const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / PAGE_SIZE));
  const pedidosPaginados = pedidosFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const aplicarStatus = async (pedido, novoStatus) => {
    try {
      await api.put(`/pedidos/admin/${pedido.id}/status`, { status: novoStatus });
      setErrosPorPedido((prev) => ({ ...prev, [pedido.id]: null }));
      return { ok: true };
    } catch (error) {
      const mensagem = error.response?.data?.message || "Falha ao atualizar o status.";
      setErrosPorPedido((prev) => ({ ...prev, [pedido.id]: mensagem }));
      return { ok: false, mensagem };
    }
  };

  const handleStatusChange = async (pedido, novoStatus) => {
    const pedidosAnteriores = [...pedidos];
    setPedidos(pedidos.map((p) => (p.id === pedido.id ? { ...p, status: novoStatus } : p)));

    const resultado = await aplicarStatus(pedido, novoStatus);
    if (resultado.ok) {
      toast.success("Status atualizado!");
    } else {
      toast.error(resultado.mensagem, { duration: 8000 });
      setPedidos(pedidosAnteriores);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!pedidoParaExcluir) return;
    try {
      await api.delete(`/pedidos/admin/${pedidoParaExcluir.id}`);
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoParaExcluir.id));
      toast.success(`Pedido #${pedidoParaExcluir.id} excluído.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao excluir pedido.");
    } finally {
      setPedidoParaExcluir(null);
    }
  };

  const toggleSelecionado = (id) => {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const todosDaPaginaSelecionados =
    pedidosPaginados.length > 0 && pedidosPaginados.every((p) => selecionados.includes(p.id));

  const toggleSelecionarPagina = () => {
    const idsDaPagina = pedidosPaginados.map((p) => p.id);
    if (todosDaPaginaSelecionados) {
      setSelecionados((prev) => prev.filter((id) => !idsDaPagina.includes(id)));
    } else {
      setSelecionados((prev) => Array.from(new Set([...prev, ...idsDaPagina])));
    }
  };

  const limparSelecao = () => setSelecionados([]);

  const handleAplicarEmMassa = async () => {
    if (selecionados.length === 0) return;
    setAplicandoLote(true);

    const pedidosAlvo = pedidos.filter((p) => selecionados.includes(p.id));
    let sucesso = 0;
    let falha = 0;

    setPedidos((prev) => prev.map((p) => (selecionados.includes(p.id) ? { ...p, status: statusLote } : p)));

    for (const pedido of pedidosAlvo) {
      const resultado = await aplicarStatus(pedido, statusLote);
      if (resultado.ok) {
        sucesso += 1;
      } else {
        falha += 1;
        setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, status: pedido.status } : p)));
      }
    }

    setAplicandoLote(false);
    setSelecionados([]);

    if (falha === 0) {
      toast.success(`${sucesso} pedido(s) atualizado(s) para "${statusLote}"!`);
    } else {
      toast.error(`${sucesso} atualizado(s), ${falha} falharam (veja o aviso no card de cada pedido).`, { duration: 7000 });
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Pedidos" />
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-stone-100 animate-pulse break-inside-avoid mb-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn pb-20">
      <PageHeader
        title="Pedidos"
        subtitle={`${pedidos.filter((p) => !p.arquivado_em).length} pedidos ativos${
          pedidos.some((p) => p.arquivado_em) ? ` · ${pedidos.filter((p) => p.arquivado_em).length} arquivados` : ""
        }`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setMostrarArquivados((v) => !v); setPagina(1); setSelecionados([]); }}
              title="Alternar visualização entre pedidos ativos e arquivados."
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                mostrarArquivados
                  ? "bg-stone-900 border-stone-900 text-white"
                  : "bg-white border-stone-200 text-stone-500"
              }`}
            >
              <Archive className="w-4 h-4" />
              {mostrarArquivados ? "Ver pedidos ativos" : "Ver arquivados"}
            </button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar por cliente ou nº do pedido..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map((status) => (
            <button
              key={status}
              onClick={() => { setFiltroStatus(status); setPagina(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filtroStatus === status
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="Nenhum pedido encontrado" description="Ajuste os filtros ou aguarde novos pedidos chegarem." /></Card>
      ) : (
        <div>
          <button
            onClick={toggleSelecionarPagina}
            className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors mb-4"
          >
            {todosDaPaginaSelecionados ? <CheckSquare className="w-4 h-4 text-brand-600" /> : <Square className="w-4 h-4" />}
            Selecionar todos desta página
          </button>

          {/* Container Masonry */}
          <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
            {pedidosPaginados.map((pedido) => {
              const statusOptions = getStatusOptions(pedido.tipo_entrega);
              const statusMeta = getStatusMeta(pedido.status);
              const tipoMeta = getTipoEntregaMeta(pedido.tipo_entrega);
              const origemMeta = getOrigemComanda(pedido.PedidoItems);
              const whatsappLink = buildWhatsappLink(pedido.telefone_cliente, buildNotifyMessage(pedido, pedido.status));
              const erro = errosPorPedido[pedido.id];
              const selecionado = selecionados.includes(pedido.id);
              const podeExcluir = STATUS_FINAIS.includes(pedido.status);

              return (
                <div key={pedido.id} className="break-inside-avoid mb-4">
                  <Card className={`p-5 flex flex-col transition-shadow ${selecionado ? "ring-2 ring-brand-400" : ""} ${tipoMeta.borderClass}`}>
                    <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <button onClick={() => toggleSelecionado(pedido.id)} className="text-stone-400 hover:text-brand-600 transition-colors shrink-0">
                          {selecionado ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5" />}
                        </button>
                        <h2 className="text-base font-bold font-display truncate">Pedido #{pedido.id}</h2>
                        <Badge color={tipoMeta.color}>{tipoMeta.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {pedido.arquivado_em ? (
                          <button
                            onClick={() => handleDesarquivar(pedido)}
                            title="Tirar do arquivo"
                            className="text-stone-300 hover:text-brand-600 p-1 transition-colors"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArquivar(pedido)}
                            title="Arquivar pedido"
                            className="text-stone-300 hover:text-stone-600 p-1 transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        {podeExcluir && (
                          <button
                            onClick={() => setPedidoParaExcluir(pedido)}
                            title="Excluir pedido"
                            className="text-stone-300 hover:text-rose-600 p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
                        {origemMeta && <Badge color={origemMeta.color}>{origemMeta.label}</Badge>}
                      </div>
                      <span className="text-base font-bold text-stone-900">{formatCurrency(pedido.valor_total)}</span>
                    </div>
                    <p className="text-xs text-stone-400 mb-3">{formatDateTime(pedido.createdAt)}</p>

                    {erro && (
                      <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-3 py-2.5 mb-3">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">Não foi possível concluir</p>
                          <p>{erro}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mb-3 text-sm">
                      <div>
                        <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wide">Cliente</h3>
                        <p className="text-stone-600">{pedido.nome_cliente}</p>
                        <p className="text-stone-400 text-xs">{pedido.telefone_cliente}</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wide">Entrega</h3>
                          <p className="text-stone-600">{pedido.tipo_entrega}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wide">Pagamento</h3>
                          <p className="text-stone-600">{pedido.forma_pagamento_ilustrativa}</p>
                        </div>
                      </div>
                      {pedido.tipo_entrega === "Delivery" && pedido.endereco_entrega && (
                        <div>
                          <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wide flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Endereço
                          </h3>
                          <p className="text-stone-600 whitespace-pre-line">{pedido.endereco_entrega}</p>
                        </div>
                      )}
                    </div>

                    <select
                      value={pedido.status}
                      onChange={(e) => handleStatusChange(pedido, e.target.value)}
                      className="w-full p-2 border border-stone-200 rounded-lg bg-white text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>

                    <div className="mb-3 flex-1">
                      <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wide mb-1.5">Itens</h3>
                      <ul className="space-y-1">
                        {pedido.PedidoItems.map((item) => (
                          <li key={item.id} className="flex justify-between p-2 bg-stone-50 rounded-lg text-xs">
                            <span className="font-medium text-stone-700 truncate pr-2">
                              {item.Produto?.nome || "Produto Indisponível"} <span className="text-stone-500">x{item.quantidade}</span>
                            </span>
                            <span className="text-stone-600 shrink-0">{formatCurrency(item.preco_unitario)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors px-3 py-2 rounded-xl mt-auto"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Notificar via WhatsApp
                      </a>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-center gap-2 pt-6">
              {Array.from({ length: totalPaginas }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPagina(i + 1)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                    pagina === i + 1 ? "bg-brand-600 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Barra flutuante de ações em massa */}
      {selecionados.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white rounded-2xl shadow-lifted px-5 py-3 flex flex-wrap items-center gap-3 animate-slideUp">
          <span className="text-sm font-semibold">{selecionados.length} selecionado(s)</span>
          <select
            value={statusLote}
            onChange={(e) => setStatusLote(e.target.value)}
            className="bg-stone-800 text-white text-sm rounded-lg px-3 py-2 border border-stone-700 focus:outline-none"
          >
            {TODOS_STATUS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button
            onClick={handleAplicarEmMassa}
            disabled={aplicandoLote}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-stone-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {aplicandoLote ? "Aplicando..." : "Aplicar a todos"}
          </button>
          <button onClick={limparSelecao} className="text-stone-400 hover:text-white p-1.5" title="Cancelar seleção">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ConfirmationModal
        show={pedidoParaExcluir !== null}
        onClose={() => setPedidoParaExcluir(null)}
        onConfirm={handleConfirmarExclusao}
        title="Excluir pedido"
        message={`Tem certeza que deseja excluir o pedido #${pedidoParaExcluir?.id}? Essa ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default GerenciarPedidos;