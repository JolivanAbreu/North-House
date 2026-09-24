const Pedido = require('../models/Pedido');
const PedidoItem = require('../models/PedidoItem');
const Produto = require('../models/Produto');

const sequelize = require('../database/config');
const { Op } = require('sequelize');

// Calcula o intervalo [inicio, fim) do período atual e do período anterior
// equivalente (para permitir a comparação "vs período anterior").
const getPeriodBounds = (periodo) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  if (periodo === 'hoje') {
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    return { inicio: hoje, fim: amanha, inicioAnterior: ontem, fimAnterior: hoje };
  }

  if (periodo === 'semana') {
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioSemanaAnterior = new Date(inicioSemana);
    inicioSemanaAnterior.setDate(inicioSemana.getDate() - 7);
    return {
      inicio: inicioSemana,
      fim: amanha,
      inicioAnterior: inicioSemanaAnterior,
      fimAnterior: inicioSemana,
    };
  }

  if (periodo === 'mes') {
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return {
      inicio: inicioMes,
      fim: amanha,
      inicioAnterior: inicioMesAnterior,
      fimAnterior: inicioMes,
    };
  }

  if (periodo === 'semestre') {
    // Semestre corrente: Jan-Jun ou Jul-Dez.
    const mesInicioSemestre = hoje.getMonth() < 6 ? 0 : 6;
    const inicioSemestre = new Date(hoje.getFullYear(), mesInicioSemestre, 1);
    const inicioSemestreAnterior = new Date(hoje.getFullYear(), mesInicioSemestre - 6, 1);
    return {
      inicio: inicioSemestre,
      fim: amanha,
      inicioAnterior: inicioSemestreAnterior,
      fimAnterior: inicioSemestre,
    };
  }

  if (periodo === 'ano') {
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    const inicioAnoAnterior = new Date(hoje.getFullYear() - 1, 0, 1);
    return {
      inicio: inicioAno,
      fim: amanha,
      inicioAnterior: inicioAnoAnterior,
      fimAnterior: inicioAno,
    };
  }

  // 'tudo' - sem filtro de data e sem comparação com período anterior
  return { inicio: null, fim: null, inicioAnterior: null, fimAnterior: null };
};

const buildWhere = (usuarioId, inicio, fim) => {
  const where = { UsuarioId: usuarioId };
  if (inicio) {
    where.createdAt = fim ? { [Op.gte]: inicio, [Op.lt]: fim } : { [Op.gte]: inicio };
  }
  return where;
};

const calcularTotais = async (where) => {
  const totalVendido = await Pedido.sum('valor_total', { where });
  const totalPedidos = await Pedido.count({ where });
  return { totalVendido: totalVendido || 0, totalPedidos: totalPedidos || 0 };
};

const calcularVariacao = (atual, anterior) => {
  if (!anterior || anterior === 0) return atual > 0 ? 100 : 0;
  return parseFloat((((atual - anterior) / anterior) * 100).toFixed(1));
};

// Rota: GET /api/estatisticas/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    const { periodo = 'tudo' } = req.query;

    const { inicio, fim, inicioAnterior, fimAnterior } = getPeriodBounds(periodo);
    const whereAtual = buildWhere(usuarioId, inicio, fim);

    // --- Totais do período atual ---
    const { totalVendido, totalPedidos } = await calcularTotais(whereAtual);

    // --- Comparação com o período anterior (não aplicável a 'tudo') ---
    let comparativo = null;
    if (inicioAnterior) {
      const whereAnterior = buildWhere(usuarioId, inicioAnterior, fimAnterior);
      const anterior = await calcularTotais(whereAnterior);
      comparativo = {
        totalVendidoAnterior: anterior.totalVendido,
        totalPedidosAnterior: anterior.totalPedidos,
        variacaoFaturamento: calcularVariacao(totalVendido, anterior.totalVendido),
        variacaoPedidos: calcularVariacao(totalPedidos, anterior.totalPedidos),
      };
    }

    // --- Produtos mais vendidos ---
    const maisVendidosRaw = await PedidoItem.findAll({
      attributes: [
        'ProdutoId',
        [sequelize.fn('SUM', sequelize.col('PedidoItem.quantidade')), 'total_vendido'],
      ],
      include: [
        { model: Produto, attributes: ['nome'] },
        {
          model: Pedido,
          attributes: [],
          where: whereAtual,
          required: true
        }
      ],
      group: ['ProdutoId', 'Produto.nome'],
      order: [[sequelize.fn('SUM', sequelize.col('PedidoItem.quantidade')), 'DESC']],
      limit: 5
    });

    const maisVendidos = maisVendidosRaw.map(item => ({
      nome: item.Produto.nome,
      total_vendido: parseInt(item.getDataValue('total_vendido'), 10)
    }));

    // --- Pedidos por status (para o gráfico de distribuição) ---
    const statusRaw = await Pedido.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      where: whereAtual,
      group: ['status'],
    });
    const pedidosPorStatus = statusRaw.map(item => ({
      status: item.status,
      total: parseInt(item.getDataValue('total'), 10),
    }));

    // --- Série temporal de faturamento (últimos dias do período, para o gráfico de tendência) ---
    const inicioSerie = inicio || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      return d;
    })();

    const serieRaw = await Pedido.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'dia'],
        [sequelize.fn('SUM', sequelize.col('valor_total')), 'total'],
      ],
      where: {
        UsuarioId: usuarioId,
        createdAt: { [Op.gte]: inicioSerie },
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
    });

    const serieFaturamento = serieRaw.map(item => ({
      dia: item.getDataValue('dia'),
      total: parseFloat(item.getDataValue('total')),
    }));

    // --- Comparativo Local (comandas do restaurante) vs. Delivery/Retirada ---
    const porTipoRaw = await Pedido.findAll({
      attributes: [
        'tipo_entrega',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_comandas'],
        [sequelize.fn('SUM', sequelize.col('valor_total')), 'total_faturado'],
      ],
      where: whereAtual,
      group: ['tipo_entrega'],
    });

    const local = porTipoRaw.find((item) => item.tipo_entrega === 'Local');
    const delivery = porTipoRaw.filter((item) => item.tipo_entrega !== 'Local');

    const comparativoLocalDelivery = {
      local: {
        totalComandas: local ? parseInt(local.getDataValue('total_comandas'), 10) : 0,
        totalFaturado: local ? parseFloat(local.getDataValue('total_faturado')) || 0 : 0,
      },
      delivery: {
        totalComandas: delivery.reduce((acc, item) => acc + parseInt(item.getDataValue('total_comandas'), 10), 0),
        totalFaturado: delivery.reduce((acc, item) => acc + (parseFloat(item.getDataValue('total_faturado')) || 0), 0),
      },
    };

    res.status(200).json({
      totalVendido,
      totalPedidos,
      maisVendidos,
      pedidosPorStatus,
      serieFaturamento,
      comparativo,
      comparativoLocalDelivery,
    });

  } catch (error) {
    console.error('ERRO EM getDashboardStats:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
};
