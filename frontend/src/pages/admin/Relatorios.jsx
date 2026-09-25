import React, { useState, useEffect, useMemo } from "react";
import { FileDown, Printer, ClipboardList } from "lucide-react";
import api from "../../services/api.mjs";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { formatCurrency, formatDateTime, getStatusMeta } from "../../utils/format.mjs";
import { downloadCSV } from "../../utils/csv.mjs";
import Logo from "../../components/Logo.jsx";
import { BRAND } from "../../config/brand.mjs";

const PERIODOS = [
  { value: "hoje", label: "Diário" },
  { value: "semana", label: "Semanal" },
  { value: "mes", label: "Mensal" },
  { value: "semestre", label: "Semestral" },
  { value: "ano", label: "Anual" },
  { value: "tudo", label: "Tudo" },
];

const TODOS_STATUS = ["Recebido", "Em preparo", "Pronto para entrega", "Pronto para retirada", "Concluído", "Cancelado"];

const dentroDoPeriodo = (dataISO, periodo) => {
  if (periodo === "tudo") return true;
  const data = new Date(dataISO);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (periodo === "hoje") {
    return data >= hoje;
  }
  if (periodo === "semana") {
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    return data >= inicioSemana;
  }
  if (periodo === "mes") {
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return data >= inicioMes;
  }
  if (periodo === "semestre") {
    const mesInicio = hoje.getMonth() < 6 ? 0 : 6;
    const inicioSemestre = new Date(hoje.getFullYear(), mesInicio, 1);
    return data >= inicioSemestre;
  }
  if (periodo === "ano") {
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    return data >= inicioAno;
  }
  return true;
};

const Relatorios = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [statusFiltro, setStatusFiltro] = useState("Todos");

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const resPedidos = await api.get("/pedidos/admin?incluirArquivados=true");
        setPedidos(resPedidos.data);
      } catch (error) {
        console.error("Erro ao buscar dados dos relatórios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    return pedidos
      .filter((p) => dentroDoPeriodo(p.createdAt, periodo))
      .filter((p) => statusFiltro === "Todos" || p.status === statusFiltro)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [pedidos, periodo, statusFiltro]);

  const resumo = useMemo(() => {
    const validos = pedidosFiltrados.filter((p) => p.status !== "Cancelado");
    const totalFaturado = validos.reduce((acc, p) => acc + parseFloat(p.valor_total), 0);
    const totalDescontos = validos.reduce((acc, p) => acc + parseFloat(p.valor_desconto || 0), 0);
    const ticketMedio = validos.length > 0 ? totalFaturado / validos.length : 0;

    const locais = validos.filter((p) => p.tipo_entrega === "Local");
    const delivery = validos.filter((p) => p.tipo_entrega !== "Local");
    const comparativo = {
      local: { comandas: locais.length, faturado: locais.reduce((acc, p) => acc + parseFloat(p.valor_total), 0) },
      delivery: { comandas: delivery.length, faturado: delivery.reduce((acc, p) => acc + parseFloat(p.valor_total), 0) },
    };

    return {
      totalPedidos: pedidosFiltrados.length,
      pedidosValidos: validos.length,
      totalFaturado,
      totalDescontos,
      ticketMedio,
      comparativo,
    };
  }, [pedidosFiltrados]);

  const handleExportarCSV = () => {
    const headers = ["Pedido", "Data", "Cliente", "Telefone", "Status", "Tipo Entrega", "Endereço", "Pagamento", "Cupom", "Desconto", "Total"];
    const rows = pedidosFiltrados.map((p) => [
      p.id,
      formatDateTime(p.createdAt),
      p.nome_cliente,
      p.telefone_cliente || "",
      p.status,
      p.tipo_entrega,
      p.endereco_entrega || "",
      p.forma_pagamento_ilustrativa,
      p.cupom_codigo || "",
      formatCurrency(p.valor_desconto || 0),
      formatCurrency(p.valor_total),
    ]);
    downloadCSV(`relatorio-pedidos-${periodo}.csv`, headers, rows);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Relatórios" />
        <div className="h-64 bg-white rounded-2xl border border-stone-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Cabeçalho com a marca da loja - só aparece na impressão/PDF */}
      <div className="hidden print:flex flex-col items-center mb-6 text-center border-b-2 border-brand-600 pb-4">
        <Logo size="xl" completo className="mb-2" />
        <h1 className="sr-only">{BRAND.nome}</h1>
        <p className="text-sm text-stone-500">
          Relatório de vendas — período: {PERIODOS.find((p) => p.value === periodo)?.label} · emitido em {formatDateTime(new Date().toISOString())}
        </p>
      </div>

      <PageHeader
        title="Relatórios"
        subtitle="Visão geral das vendas, com filtros por período e status"
        action={
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handleExportarCSV}
              disabled={pedidosFiltrados.length === 0}
              className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" /> Exportar CSV
            </button>
            <button
              onClick={() => window.print()}
              disabled={pedidosFiltrados.length === 0}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-soft disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6 print:hidden">
        <div className="flex gap-2 flex-wrap">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                periodo === p.value ? "bg-brand-600 text-white shadow-soft" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="Todos">Todos os status</option>
          {TODOS_STATUS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-stone-500 uppercase">Pedidos</h3>
          <p className="text-2xl font-bold font-display mt-1">{resumo.totalPedidos}</p>
        </Card>
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-stone-500 uppercase">Faturamento</h3>
          <p className="text-2xl font-bold font-display mt-1">{formatCurrency(resumo.totalFaturado)}</p>
          <p className="text-xs text-stone-400 mt-1">exclui cancelados</p>
        </Card>
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-stone-500 uppercase">Ticket Médio</h3>
          <p className="text-2xl font-bold font-display mt-1">{formatCurrency(resumo.ticketMedio)}</p>
        </Card>
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-stone-500 uppercase">Descontos</h3>
          <p className="text-2xl font-bold font-display mt-1 text-emerald-600">{formatCurrency(resumo.totalDescontos)}</p>
        </Card>
      </div>

      {/* Comparativo Comandas Locais vs. Delivery/Retirada */}
      <Card className="mb-8">
        <CardHeader title="Local vs. Delivery" subtitle="Comparativo do período selecionado" />
        <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
            <p className="text-xs font-semibold text-violet-700 uppercase">Comandas Locais</p>
            <p className="text-2xl font-bold font-display text-violet-900 mt-1">{formatCurrency(resumo.comparativo.local.faturado)}</p>
            <p className="text-xs text-violet-600 mt-1">{resumo.comparativo.local.comandas} comanda(s)</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 uppercase">Delivery / Retirada</p>
            <p className="text-2xl font-bold font-display text-blue-900 mt-1">{formatCurrency(resumo.comparativo.delivery.faturado)}</p>
            <p className="text-xs text-blue-600 mt-1">{resumo.comparativo.delivery.comandas} pedido(s)</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Pedidos no período" subtitle={`${pedidosFiltrados.length} registros`} />
        <CardBody>
          {pedidosFiltrados.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Nenhum pedido neste filtro" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                    <th className="text-left p-3">Pedido</th>
                    <th className="text-left p-3">Data</th>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Pagamento</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((pedido) => {
                    const meta = getStatusMeta(pedido.status);
                    return (
                      <tr key={pedido.id} className="border-b border-stone-50">
                        <td className="p-3 font-medium text-stone-800">#{pedido.id}</td>
                        <td className="p-3 text-stone-500">{formatDateTime(pedido.createdAt)}</td>
                        <td className="p-3 text-stone-700">{pedido.nome_cliente}</td>
                        <td className="p-3"><Badge color={meta.color}>{meta.label}</Badge></td>
                        <td className="p-3 text-stone-500">{pedido.forma_pagamento_ilustrativa}</td>
                        <td className="p-3 text-right font-semibold text-stone-800">{formatCurrency(pedido.valor_total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Relatorios;
