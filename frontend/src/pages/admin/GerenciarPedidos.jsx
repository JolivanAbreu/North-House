import React, { useState, useEffect, useMemo } from "react";
import { FileDown, Hash, User, CalendarDays, FilterX, RefreshCw } from "lucide-react";
import api from "../../services/api.mjs";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card } from "../../components/ui/Card.jsx";
import TabelaPedidos from "../../components/TabelaPedidos.jsx";
import { formatCurrency, formatDateTime } from "../../utils/format.mjs";
import { PERIODOS, dentroDoPeriodo } from "../../utils/periodos.mjs";
import { normalizar } from "../../utils/buscaPedidos.mjs";
import { downloadCSV } from "../../utils/csv.mjs";

// Aba Pedidos: histórico completo de todas as comandas e pedidos (salão,
// delivery e retirada), inclusive os arquivados, com filtros por nº, cliente,
// dia, período pronto (diário...anual) ou período específico (de/até).

const PERIODOS_HISTORICO = [...PERIODOS, { value: "especifico", label: "Específico" }];
const STATUS = ["Recebido", "Em preparo", "Saiu para entrega", "Pronto para retirada", "Concluído", "Cancelado"];
const TIPOS = [
  { value: "Todos", label: "Todos os tipos" },
  { value: "Local", label: "Salão (local)" },
  { value: "Delivery", label: "Delivery" },
  { value: "Retirada", label: "Retirada" },
];

const FILTROS_INICIAIS = {
  numero: "",
  cliente: "",
  periodo: "tudo",
  de: "",
  ate: "",
  status: "Todos",
  tipo: "Todos",
};

const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const campo =
  "w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400";

const GerenciarPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [f, setF] = useState(FILTROS_INICIAIS);

  const carregar = async (silencioso = false) => {
    try {
      if (silencioso) setAtualizando(true);
      else setLoading(true);
      const [resPedidos, resPerfil] = await Promise.all([
        api.get("/pedidos/admin?incluirArquivados=true"),
        api.get("/perfil").catch(() => ({ data: null })),
      ]);
      setPedidos(resPedidos.data);
      setPerfil(resPerfil.data);
    } catch (error) {
      console.error("Erro ao buscar histórico de pedidos:", error);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const set = (campoNome) => (valor) => setF((prev) => ({ ...prev, [campoNome]: valor }));

  // Escolher um dia é o mesmo que um período específico de um dia só
  const diaUnico = f.periodo === "especifico" && f.de && f.de === f.ate ? f.de : "";
  const escolherDia = (dia) =>
    setF((prev) => (dia ? { ...prev, periodo: "especifico", de: dia, ate: dia } : { ...prev, periodo: "tudo", de: "", ate: "" }));

  const filtrados = useMemo(() => {
    const numero = String(f.numero).replace(/\D/g, "");
    const cliente = normalizar(f.cliente);
    return pedidos
      .filter((p) => !numero || String(p.id) === numero)
      .filter((p) => !cliente || normalizar(p.nome_cliente).includes(cliente))
      .filter((p) => dentroDoPeriodo(p.createdAt, f.periodo, { de: f.de, ate: f.ate }))
      .filter((p) => f.status === "Todos" || p.status === f.status || (f.status === "Saiu para entrega" && p.status === "Pronto para entrega"))
      .filter((p) => f.tipo === "Todos" || p.tipo_entrega === f.tipo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [pedidos, f]);

  const resumo = useMemo(() => {
    const validos = filtrados.filter((p) => p.status !== "Cancelado");
    const faturado = validos.filter((p) => p.pago).reduce((acc, p) => acc + (parseFloat(p.valor_total) || 0), 0);
    return {
      total: filtrados.length,
      faturado,
      ticket: validos.filter((p) => p.pago).length ? faturado / validos.filter((p) => p.pago).length : 0,
      cancelados: filtrados.length - validos.length,
      aPagar: validos.filter((p) => !p.pago).length,
    };
  }, [filtrados]);

  const filtrosAtivos =
    f.numero || f.cliente || f.periodo !== "tudo" || f.status !== "Todos" || f.tipo !== "Todos";

  const exportarCSV = () => {
    const headers = ["Pedido", "Data", "Cliente", "Tipo", "Mesa", "Status", "Pagamento", "Itens", "Total"];
    const rows = filtrados.map((p) => [
      p.id,
      formatDateTime(p.createdAt),
      p.nome_cliente || "",
      p.tipo_entrega,
      p.mesa_numero || "",
      p.status,
      p.pago ? p.forma_pagamento_ilustrativa || "Pago" : "A pagar",
      (p.PedidoItems || []).map((i) => `${parseFloat(i.quantidade)}x ${i.Produto?.nome || "Produto"}`).join("; "),
      formatCurrency(p.valor_total),
    ]);
    downloadCSV(`historico-pedidos-${hojeISO()}.csv`, headers, rows);
  };

  return (
    <div className="animate-fadeIn pb-16">
      <PageHeader
        title="Pedidos"
        subtitle={
          <span className="inline-flex items-center gap-2">
            Histórico de todas as comandas, deliveries e retiradas
            <button onClick={() => carregar(true)} className="text-stone-400 hover:text-stone-700" title="Atualizar">
              <RefreshCw className={`w-3.5 h-3.5 ${atualizando ? "animate-spin" : ""}`} />
            </button>
          </span>
        }
        action={
          <button
            onClick={exportarCSV}
            disabled={filtrados.length === 0}
            className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" /> Exportar CSV
          </button>
        }
      />

      {/* Filtros */}
      <Card className="p-4 sm:p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="block">
            <span className="flex items-center gap-1 text-xs font-semibold text-stone-500 mb-1"><Hash className="w-3.5 h-3.5" /> Nº do pedido</span>
            <input
              type="text"
              inputMode="numeric"
              value={f.numero}
              onChange={(e) => set("numero")(e.target.value.replace(/[^\d#]/g, ""))}
              placeholder="Ex: 152"
              className={campo}
            />
          </label>
          <label className="block">
            <span className="flex items-center gap-1 text-xs font-semibold text-stone-500 mb-1"><User className="w-3.5 h-3.5" /> Cliente</span>
            <input
              type="text"
              value={f.cliente}
              onChange={(e) => set("cliente")(e.target.value)}
              placeholder="Nome do cliente"
              className={campo}
            />
          </label>
          <label className="block">
            <span className="flex items-center gap-1 text-xs font-semibold text-stone-500 mb-1"><CalendarDays className="w-3.5 h-3.5" /> Data</span>
            <input type="date" value={diaUnico} max={hojeISO()} onChange={(e) => escolherDia(e.target.value)} className={campo} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-stone-500 mb-1 block">Status</span>
            <select value={f.status} onChange={(e) => set("status")(e.target.value)} className={campo}>
              <option value="Todos">Todos os status</option>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-stone-500 mb-1 block">Tipo</span>
            <select value={f.tipo} onChange={(e) => set("tipo")(e.target.value)} className={campo}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs font-semibold text-stone-500 mr-1">Período:</span>
          {PERIODOS_HISTORICO.map((p) => {
            const ativo = f.periodo === p.value && !(p.value === "especifico" && diaUnico);
            return (
              <button
                key={p.value}
                onClick={() =>
                  setF((prev) => ({
                    ...prev,
                    periodo: p.value,
                    de: p.value === "especifico" ? prev.de : "",
                    ate: p.value === "especifico" ? prev.ate : "",
                  }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  ativo ? "bg-brand-600 text-white shadow-soft" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                }`}
              >
                {p.label}
              </button>
            );
          })}
          {filtrosAtivos && (
            <button
              onClick={() => setF(FILTROS_INICIAIS)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              <FilterX className="w-3.5 h-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        {f.periodo === "especifico" && !diaUnico && (
          <div className="flex flex-wrap items-end gap-3 mt-3 p-3 bg-stone-50 border border-stone-100 rounded-xl animate-fadeIn">
            <label className="block">
              <span className="text-xs font-semibold text-stone-500 mb-1 block">De</span>
              <input type="date" value={f.de} max={f.ate || hojeISO()} onChange={(e) => set("de")(e.target.value)} className={campo} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-stone-500 mb-1 block">Até</span>
              <input type="date" value={f.ate} min={f.de || undefined} max={hojeISO()} onChange={(e) => set("ate")(e.target.value)} className={campo} />
            </label>
            <p className="text-xs text-stone-400 pb-2">Deixe um dos lados vazio para "a partir de" ou "até".</p>
          </div>
        )}
      </Card>

      {/* Resumo do filtro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Resumo label="Pedidos encontrados" valor={resumo.total} />
        <Resumo label="Recebido (pagos)" valor={formatCurrency(resumo.faturado)} />
        <Resumo label="Ticket médio" valor={formatCurrency(resumo.ticket)} />
        <Resumo label="A pagar / cancelados" valor={`${resumo.aPagar} / ${resumo.cancelados}`} />
      </div>

      {loading ? (
        <div className="h-64 bg-white rounded-2xl border border-stone-100 animate-pulse" />
      ) : (
        <TabelaPedidos
          titulo="Histórico de pedidos"
          pedidos={filtrados}
          perfil={perfil}
          onExcluido={(id) => setPedidos((prev) => prev.filter((p) => p.id !== id))}
        />
      )}
    </div>
  );
};

const Resumo = ({ label, valor }) => (
  <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
    <p className="text-xl font-bold font-display mt-0.5 tabular-nums text-stone-900">{valor}</p>
  </div>
);

export default GerenciarPedidos;
