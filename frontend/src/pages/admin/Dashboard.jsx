import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, Receipt, BarChart3, Trophy } from "lucide-react";
import api from "../../services/api.mjs";
import { formatCurrency, getStatusMeta } from "../../utils/format.mjs";
import { StatCardSkeleton } from "../../components/ui/Skeleton.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Badge from "../../components/ui/Badge.jsx";

const StatCard = ({ title, value, prefix = "", icon: Icon, delta }) => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{title}</h3>
        <p className="text-2xl md:text-3xl font-bold font-display mt-2 text-stone-900">
          {prefix}
          {value}
        </p>
      </div>
      {Icon && (
        <span className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-brand-600" />
        </span>
      )}
    </div>
    {delta !== undefined && delta !== null && (
      <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
        {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {Math.abs(delta)}% vs período anterior
      </div>
    )}
  </Card>
);

const FilterButton = ({ text, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
      isActive ? "bg-brand-600 text-white shadow-soft" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
    }`}
  >
    {text}
  </button>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/estatisticas/dashboard?periodo=${periodo}`);
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [periodo]);

  const filtros = (
    <div className="flex gap-2 flex-wrap">
      <FilterButton text="Hoje" onClick={() => setPeriodo("hoje")} isActive={periodo === "hoje"} />
      <FilterButton text="Semana" onClick={() => setPeriodo("semana")} isActive={periodo === "semana"} />
      <FilterButton text="Mês" onClick={() => setPeriodo("mes")} isActive={periodo === "mes"} />
      <FilterButton text="Tudo" onClick={() => setPeriodo("tudo")} isActive={periodo === "tudo"} />
    </div>
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" action={filtros} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <PageHeader title="Dashboard" action={filtros} />
        <EmptyState icon={BarChart3} title="Não foi possível carregar os dados" />
      </div>
    );
  }

  const ticketMedio = stats.totalPedidos > 0 ? stats.totalVendido / stats.totalPedidos : 0;
  const totalPedidosStatus = (stats.pedidosPorStatus || []).reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Dashboard" subtitle="Visão geral do seu negócio" action={filtros} />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Faturamento Total"
          value={formatCurrency(stats.totalVendido).replace('R$', '').trim()}
          prefix="R$ "
          icon={Wallet}
          delta={stats.comparativo?.variacaoFaturamento}
        />
        <StatCard
          title="Total de Pedidos"
          value={stats.totalPedidos}
          icon={ShoppingCart}
          delta={stats.comparativo?.variacaoPedidos}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(ticketMedio).replace('R$', '').trim()}
          prefix="R$ "
          icon={Receipt}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos mais vendidos - lista simples */}
        <Card>
          <CardHeader title="Produtos Mais Vendidos" subtitle="Nome e quantidade no período" />
          <CardBody>
            {stats.maisVendidos.length > 0 ? (
              <ol className="divide-y divide-stone-100">
                {stats.maisVendidos.map((produto, idx) => (
                  <li key={produto.nome} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                        ${idx === 0 ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"}`}>
                        {idx === 0 ? <Trophy className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      <span className="font-medium text-stone-800">{produto.nome}</span>
                    </div>
                    <span className="text-stone-600 font-semibold text-sm whitespace-nowrap">
                      {produto.total_vendido} {produto.total_vendido === 1 ? "unidade" : "unidades"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-center text-stone-400 py-10">
                Ainda não há dados de vendas de produtos para este período.
              </p>
            )}
          </CardBody>
        </Card>

        {/* Pedidos por status - lista simples */}
        <Card>
          <CardHeader title="Pedidos por Status" />
          <CardBody>
            {stats.pedidosPorStatus?.length > 0 ? (
              <ul className="divide-y divide-stone-100">
                {stats.pedidosPorStatus.map((item) => {
                  const meta = getStatusMeta(item.status);
                  const pct = totalPedidosStatus > 0 ? Math.round((item.total / totalPedidosStatus) * 100) : 0;
                  return (
                    <li key={item.status} className="flex items-center justify-between py-3 gap-3">
                      <Badge color={meta.color}>{meta.label}</Badge>
                      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-stone-600 font-semibold text-sm w-10 text-right">{item.total}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-center text-stone-400 py-10">Nenhum pedido neste período.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
