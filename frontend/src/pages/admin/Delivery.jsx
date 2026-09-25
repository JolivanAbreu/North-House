import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Bike, ShoppingBag, Phone, MapPin, Clock, Printer, Wallet, X,
  MessageCircle, ChevronRight, RotateCcw, Search, RefreshCw, PackageCheck, ChefHat, Inbox, Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.mjs";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import NovaComandaModal from "../../components/NovaComandaModal.jsx";
import AdicionarItemModal from "../../components/AdicionarItemModal.jsx";
import PagamentoComandaModal from "../../components/PagamentoComandaModal.jsx";
import {
  formatCurrency, formatQuantidade, getTipoEntregaMeta, tempoDecorrido, buildWhatsappLink,
} from "../../utils/format.mjs";
import { formatarTelefone, somenteDigitos } from "../../utils/mascaras.mjs";
import { imprimirComanda } from "../../utils/impressao.mjs";
import { BRAND } from "../../config/brand.mjs";

// Pedidos de delivery e retirada recebidos por telefone/WhatsApp, num quadro
// por etapa: Novos -> Em preparo -> Saiu / Pronto p/ retirada -> Concluídos hoje.

const INTERVALO_ATUALIZACAO_MS = 30000;
const TIPOS_EXTERNOS = ["Delivery", "Retirada"];
const ETAPA_FINAL = ["Saiu para entrega", "Pronto para entrega", "Pronto para retirada"];

const COLUNAS = [
  { id: "novos", titulo: "Novos", status: ["Recebido"], icon: Inbox, cor: "text-blue-700 bg-blue-50" },
  { id: "preparo", titulo: "Em preparo", status: ["Em preparo"], icon: ChefHat, cor: "text-amber-700 bg-amber-50" },
  { id: "saida", titulo: "Saiu / Pronto p/ retirada", status: ETAPA_FINAL, icon: Bike, cor: "text-violet-700 bg-violet-50" },
  { id: "concluidos", titulo: "Concluídos hoje", status: ["Concluído"], icon: PackageCheck, cor: "text-emerald-700 bg-emerald-50" },
];

const FILTROS = [
  { value: "Todos", label: "Todos" },
  { value: "Delivery", label: "Delivery" },
  { value: "Retirada", label: "Retirada" },
];

const ehHoje = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString();
};

// Próxima etapa e texto do botão principal do card
const proximaEtapa = (pedido) => {
  if (pedido.status === "Recebido") return { status: "Em preparo", label: "Iniciar preparo" };
  if (pedido.status === "Em preparo") {
    return pedido.tipo_entrega === "Delivery"
      ? { status: "Saiu para entrega", label: "Saiu para entrega" }
      : { status: "Pronto para retirada", label: "Pronto p/ retirada" };
  }
  if (ETAPA_FINAL.includes(pedido.status)) {
    return { status: "Concluído", label: pedido.tipo_entrega === "Delivery" ? "Entregue" : "Retirado" };
  }
  return null;
};

// Mensagem pronta de WhatsApp conforme a etapa do pedido
const mensagemWhatsapp = (pedido) => {
  const nome = pedido.nome_cliente && pedido.nome_cliente !== "Cliente" ? ` ${pedido.nome_cliente.split(" ")[0]}` : "";
  const total = formatCurrency(pedido.valor_total);
  switch (pedido.status) {
    case "Recebido":
      return `Olá${nome}! Recebemos seu pedido na ${BRAND.nome}. Total: ${total}.`;
    case "Em preparo":
      return `Olá${nome}! Seu pedido na ${BRAND.nome} já está sendo preparado.`;
    case "Saiu para entrega":
    case "Pronto para entrega":
      return `Olá${nome}! Seu pedido da ${BRAND.nome} saiu para entrega. Total: ${total}.`;
    case "Pronto para retirada":
      return `Olá${nome}! Seu pedido já está pronto para retirada na ${BRAND.nome}. Total: ${total}.`;
    default:
      return `Olá${nome}! Obrigado pela preferência na ${BRAND.nome}!`;
  }
};

const linkWhatsapp = (pedido) => {
  const digitos = somenteDigitos(pedido.telefone_cliente);
  if (digitos.length < 10) return null;
  const comPais = digitos.length <= 11 ? `55${digitos}` : digitos;
  return buildWhatsappLink(comPais, mensagemWhatsapp(pedido));
};

const Delivery = () => {
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtro, setFiltro] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [, setTick] = useState(0);

  const [showNovo, setShowNovo] = useState(false);
  const [criando, setCriando] = useState(false);
  const [pedidoItens, setPedidoItens] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [pedidoPagar, setPedidoPagar] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [pedidoCancelar, setPedidoCancelar] = useState(null);
  const [ocupadoId, setOcupadoId] = useState(null);

  const fetchTudo = useCallback(async ({ silencioso = false } = {}) => {
    try {
      if (silencioso) setAtualizando(true);
      else setLoading(true);
      const [resPedidos, resProdutos, resPerfil] = await Promise.all([
        api.get("/pedidos/admin"),
        api.get("/produtos"),
        api.get("/perfil"),
      ]);
      setPedidos(resPedidos.data);
      setProdutos(resProdutos.data);
      setPerfil(resPerfil.data || null);
    } catch (error) {
      console.error("Erro ao carregar pedidos de delivery:", error);
      if (!silencioso) toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    fetchTudo();
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

  const pedidosExternos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pedidos
      .filter((p) => TIPOS_EXTERNOS.includes(p.tipo_entrega))
      .filter((p) => p.status !== "Cancelado")
      .filter((p) => p.status !== "Concluído" || ehHoje(p.updatedAt))
      .filter((p) => filtro === "Todos" || p.tipo_entrega === filtro)
      .filter((p) =>
        !termo ||
        (p.nome_cliente || "").toLowerCase().includes(termo) ||
        somenteDigitos(p.telefone_cliente).includes(somenteDigitos(termo) || "§") ||
        (p.endereco_entrega || "").toLowerCase().includes(termo),
      );
  }, [pedidos, filtro, busca]);

  const porColuna = useMemo(() => {
    const mapa = {};
    for (const col of COLUNAS) {
      mapa[col.id] = pedidosExternos
        .filter((p) => col.status.includes(p.status))
        .sort((a, b) =>
          col.id === "concluidos"
            ? new Date(b.updatedAt) - new Date(a.updatedAt)
            : new Date(a.createdAt) - new Date(b.createdAt),
        );
    }
    return mapa;
  }, [pedidosExternos]);

  const faturadoHoje = useMemo(
    () =>
      pedidos
        .filter((p) => TIPOS_EXTERNOS.includes(p.tipo_entrega) && p.pago && ehHoje(p.updatedAt))
        .reduce((soma, p) => soma + (parseFloat(p.valor_total) || 0), 0),
    [pedidos],
  );

  const substituir = (atualizado) => {
    if (!atualizado?.id) return;
    setPedidos((prev) => prev.map((p) => (p.id === atualizado.id ? { ...p, ...atualizado } : p)));
  };

  // ---------- Ações ----------

  const handleCriar = async (dados) => {
    setCriando(true);
    try {
      const response = await api.post("/pedidos/admin", dados);
      setPedidos((prev) => [response.data, ...prev]);
      setShowNovo(false);
      setPedidoItens(response.data);
      toast.success("Pedido criado! Agora adicione os itens.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao criar pedido.");
    } finally {
      setCriando(false);
    }
  };

  const handleAdicionarItem = async ({ produtoId, quantidade }) => {
    if (!pedidoItens) return false;
    setAdicionando(true);
    try {
      const atual = pedidos.find((p) => p.id === pedidoItens.id) || pedidoItens;
      const existente = atual.PedidoItems?.find(
        (i) => String(i.Produto?.id || i.ProdutoId) === String(produtoId) && !i.variacao_nome,
      );
      const response = existente
        ? await api.put(`/pedidos/admin/${atual.id}/itens/${existente.id}`, {
          quantidade: parseFloat(existente.quantidade) + parseFloat(quantidade),
        })
        : await api.post(`/pedidos/admin/${atual.id}/itens`, { produtoId, quantidade });
      substituir(response.data);
      toast.success(existente ? "Quantidade atualizada!" : "Item adicionado!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao adicionar item.");
      return false;
    } finally {
      setAdicionando(false);
    }
  };

  const handleRemoverItem = async (pedido, itemId) => {
    setOcupadoId(pedido.id);
    try {
      const response = await api.delete(`/pedidos/admin/${pedido.id}/itens/${itemId}`);
      if (response.data?.id) substituir(response.data);
      else await fetchTudo({ silencioso: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao remover item.");
    } finally {
      setOcupadoId(null);
    }
  };

  const mudarStatus = async (pedido, status) => {
    setOcupadoId(pedido.id);
    try {
      const response = await api.put(`/pedidos/admin/${pedido.id}/status`, { status });
      // A rota de status não devolve os itens com o nome do produto: atualiza só o status
      substituir({ id: pedido.id, status: response.data.status, updatedAt: response.data.updatedAt || new Date().toISOString() });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao atualizar o pedido.");
      return false;
    } finally {
      setOcupadoId(null);
    }
  };

  const handleAvancar = async (pedido) => {
    const prox = proximaEtapa(pedido);
    if (!prox) return;
    if (prox.status === "Concluído") {
      if (!pedido.PedidoItems?.length) {
        toast.error("Adicione ao menos um item antes de concluir.");
        return;
      }
      // Ainda não pago: cobra agora (o pagamento já conclui o pedido)
      if (!pedido.pago) {
        setPedidoPagar(pedido);
        return;
      }
    }
    if (prox.status !== "Concluído" && !pedido.PedidoItems?.length) {
      toast.error("Adicione os itens do pedido primeiro.");
      return;
    }
    const ok = await mudarStatus(pedido, prox.status);
    if (ok) toast.success(prox.status === "Concluído" ? "Pedido concluído!" : `Pedido: ${prox.label.toLowerCase()}.`);
  };

  const handleGerarPix = async (id) => (await api.post(`/pedidos/admin/${id}/pix`)).data;

  const handleFinalizar = async (id, forma_pagamento) => {
    setFinalizando(true);
    try {
      const response = await api.put(`/pedidos/admin/${id}/finalizar`, { forma_pagamento });
      substituir(response.data);
      setPedidoPagar(null);
      toast.success(
        response.data.status === "Concluído"
          ? "Pagamento recebido e pedido concluído!"
          : "Pagamento registrado. O pedido segue no quadro até a entrega.",
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao registrar pagamento.");
    } finally {
      setFinalizando(false);
    }
  };

  const handleReabrir = async (pedido) => {
    setOcupadoId(pedido.id);
    try {
      await api.put(`/pedidos/admin/${pedido.id}/reabrir`);
      toast.success("Pedido reaberto.");
      await fetchTudo({ silencioso: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao reabrir pedido.");
    } finally {
      setOcupadoId(null);
    }
  };

  const handleCancelar = async () => {
    if (!pedidoCancelar) return;
    const ok = await mudarStatus(pedidoCancelar, "Cancelado");
    if (ok) toast.success("Pedido cancelado.");
    setPedidoCancelar(null);
  };

  // ---------- Render ----------

  const totalAtivos = porColuna.novos.length + porColuna.preparo.length + porColuna.saida.length;

  return (
    <div className="animate-fadeIn pb-16">
      <PageHeader
        title="Delivery e Retirada"
        subtitle={
          <span className="inline-flex items-center gap-2">
            {totalAtivos} pedido(s) em andamento · {formatCurrency(faturadoHoje)} recebidos hoje
            <button onClick={() => fetchTudo({ silencioso: true })} className="text-stone-400 hover:text-stone-700" title="Atualizar agora">
              <RefreshCw className={`w-3.5 h-3.5 ${atualizando ? "animate-spin" : ""}`} />
            </button>
          </span>
        }
        action={
          <button
            onClick={() => setShowNovo(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-soft"
          >
            <Plus className="w-4 h-4" /> Novo pedido
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filtro === f.value ? "bg-stone-900 text-white shadow-sm" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente, telefone ou endereço"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUNAS.map((c) => <div key={c.id} className="h-64 bg-white rounded-2xl border border-stone-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUNAS.map((col) => {
            const Icon = col.icon;
            const lista = porColuna[col.id];
            return (
              <section key={col.id} className="bg-stone-100/70 border border-stone-200/70 rounded-2xl p-3 min-w-0">
                <header className="flex items-center gap-2 px-1 pb-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${col.cor}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-stone-800 truncate">{col.titulo}</h2>
                  <span className="ml-auto text-xs font-bold text-stone-500 bg-white border border-stone-200 rounded-full px-2 py-0.5">
                    {lista.length}
                  </span>
                </header>
                <div className="space-y-3">
                  {lista.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6 border border-dashed border-stone-300 rounded-xl">
                      Nenhum pedido
                    </p>
                  ) : (
                    lista.map((pedido) => (
                      <PedidoCard
                        key={pedido.id}
                        pedido={pedido}
                        ocupado={ocupadoId === pedido.id}
                        onAvancar={() => handleAvancar(pedido)}
                        onItens={() => setPedidoItens(pedido)}
                        onRemoverItem={(itemId) => handleRemoverItem(pedido, itemId)}
                        onPagar={() => setPedidoPagar(pedido)}
                        onImprimir={() => imprimirComanda(pedido, perfil)}
                        onCancelar={() => setPedidoCancelar(pedido)}
                        onReabrir={() => handleReabrir(pedido)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <NovaComandaModal
        key={showNovo ? "novo-aberto" : "novo-fechado"}
        show={showNovo}
        onClose={() => setShowNovo(false)}
        onConfirm={handleCriar}
        salvando={criando}
        tipoInicial="Delivery"
        tiposPermitidos={TIPOS_EXTERNOS}
        titulo="Novo pedido"
      />

      <AdicionarItemModal
        show={!!pedidoItens}
        onClose={() => setPedidoItens(null)}
        onConfirm={handleAdicionarItem}
        produtos={produtos}
        adicionando={adicionando}
      />

      <PagamentoComandaModal
        show={!!pedidoPagar}
        onClose={() => setPedidoPagar(null)}
        comanda={pedidoPagar}
        onGerarPix={handleGerarPix}
        onFinalizar={handleFinalizar}
        finalizando={finalizando}
      />

      <ConfirmationModal
        show={!!pedidoCancelar}
        onClose={() => setPedidoCancelar(null)}
        onConfirm={handleCancelar}
        title="Cancelar pedido"
        message={`Cancelar o pedido de ${pedidoCancelar?.nome_cliente || "cliente"}? Ele sai do quadro, mas continua no histórico.`}
      />
    </div>
  );
};

const PedidoCard = ({ pedido, ocupado, onAvancar, onItens, onRemoverItem, onPagar, onImprimir, onCancelar, onReabrir }) => {
  const tipoMeta = getTipoEntregaMeta(pedido.tipo_entrega);
  const itens = pedido.PedidoItems || [];
  const concluido = pedido.status === "Concluído";
  const prox = proximaEtapa(pedido);
  const whatsapp = linkWhatsapp(pedido);
  const editavel = !pedido.pago && !concluido;
  const TipoIcon = pedido.tipo_entrega === "Delivery" ? Bike : ShoppingBag;

  return (
    <article className={`rounded-xl border shadow-sm p-3.5 transition-opacity ${tipoMeta.cardClass} ${ocupado ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-[15px] text-stone-900 truncate leading-tight">{pedido.nome_cliente || "Cliente"}</h3>
          <p className="flex items-center gap-1 text-[11px] text-stone-500 mt-1">
            <Clock className="w-3 h-3" /> {tempoDecorrido(pedido.createdAt)}
          </p>
        </div>
        <Badge color={tipoMeta.color} className="shrink-0">
          <TipoIcon className="w-3 h-3" /> {tipoMeta.label}
        </Badge>
      </div>

      {/* Contato */}
      {(pedido.telefone_cliente || pedido.endereco_entrega) && (
        <div className="mt-2.5 space-y-1 text-xs text-stone-600">
          {pedido.telefone_cliente && (
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" /> {formatarTelefone(pedido.telefone_cliente)}
            </p>
          )}
          {pedido.endereco_entrega && (
            <p className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{pedido.endereco_entrega}</span>
            </p>
          )}
        </div>
      )}

      {/* Itens */}
      <div className="mt-3 pt-2.5 border-t border-stone-200/70">
        {itens.length === 0 ? (
          <button onClick={onItens} className="w-full text-xs font-semibold text-brand-700 bg-brand-50 border border-dashed border-brand-200 rounded-lg py-2 hover:bg-brand-100">
            + Adicionar itens
          </button>
        ) : (
          <ul className="space-y-1">
            {itens.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-stone-700 shrink-0">{formatQuantidade(item.quantidade)}×</span>
                <span className="text-stone-700 truncate flex-1">{item.Produto?.nome || "Produto"}</span>
                <span className="text-stone-500 tabular-nums shrink-0">
                  {formatCurrency(parseFloat(item.preco_unitario) * parseFloat(item.quantidade))}
                </span>
                {editavel && (
                  <button onClick={() => onRemoverItem(item.id)} className="text-stone-300 hover:text-rose-600 shrink-0" aria-label="Remover item">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Total + pagamento */}
      <div className="flex items-center justify-between mt-3">
        {pedido.pago ? (
          <Badge color="emerald">Pago{pedido.forma_pagamento_ilustrativa ? ` · ${pedido.forma_pagamento_ilustrativa}` : ""}</Badge>
        ) : (
          <Badge color="rose">A receber</Badge>
        )}
        <span className="text-lg font-black font-display text-stone-900 tabular-nums">{formatCurrency(pedido.valor_total)}</span>
      </div>

      {/* Ações */}
      <div className="mt-3 flex items-center gap-1.5">
        {!concluido && prox && (
          <button
            onClick={onAvancar}
            className="flex-1 flex items-center justify-center gap-1 bg-stone-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            {prox.label} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
        {concluido && (
          <button
            onClick={onReabrir}
            className="flex-1 flex items-center justify-center gap-1 bg-white border border-stone-200 text-stone-700 text-xs font-bold py-2 rounded-lg hover:bg-stone-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reabrir
          </button>
        )}
        {editavel && itens.length > 0 && (
          <IconBtn title="Adicionar itens" onClick={onItens}><Plus className="w-4 h-4" /></IconBtn>
        )}
        {!pedido.pago && itens.length > 0 && (
          <IconBtn title="Receber pagamento" onClick={onPagar} className="hover:text-emerald-600"><Wallet className="w-4 h-4" /></IconBtn>
        )}
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            title="Avisar cliente no WhatsApp"
            className="p-2 rounded-lg bg-white border border-stone-200 text-stone-500 hover:text-emerald-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        )}
        {itens.length > 0 && (
          <IconBtn title="Imprimir comanda" onClick={onImprimir}><Printer className="w-4 h-4" /></IconBtn>
        )}
        {!concluido && (
          <IconBtn title="Cancelar pedido" onClick={onCancelar} className="hover:text-rose-600"><Ban className="w-4 h-4" /></IconBtn>
        )}
      </div>
    </article>
  );
};

const IconBtn = ({ children, title, onClick, className = "" }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={`p-2 rounded-lg bg-white border border-stone-200 text-stone-500 hover:text-stone-900 transition-colors ${className}`}
  >
    {children}
  </button>
);

export default Delivery;
