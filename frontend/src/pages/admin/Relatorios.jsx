import React, { useState, useEffect, useMemo } from "react";
import { FileDown, Printer } from "lucide-react";
import api from "../../services/api.mjs";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import TabelaPedidos from "../../components/TabelaPedidos.jsx";
import { formatCurrency, formatDateTime } from "../../utils/format.mjs";
import { PERIODOS, dentroDoPeriodo } from "../../utils/periodos.mjs";
import { downloadCSV } from "../../utils/csv.mjs";
import Logo from "../../components/Logo.jsx";
import { BRAND } from "../../config/brand.mjs";

const TODOS_STATUS = ["Recebido", "Em preparo", "Saiu para entrega", "Pronto para retirada", "Concluído", "Cancelado"];

const Relatorios = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const [resPedidos, resPerfil] = await Promise.all([
          api.get("/pedidos/admin?incluirArquivados=true"),
          api.get("/perfil").catch(() => ({ data: null })),
        ]);
        setPedidos(resPedidos.data);
        setPerfil(resPerfil.data);
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

      <TabelaPedidos
        pedidos={pedidosFiltrados}
        perfil={perfil}
        onExcluido={(id) => setPedidos((prev) => prev.filter((p) => p.id !== id))}
      />
    </div>
  );
};

export default Relatorios;
