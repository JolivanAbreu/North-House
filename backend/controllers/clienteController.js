const Pedido = require('../models/Pedido');
const PedidoItem = require('../models/PedidoItem');
const Produto = require('../models/Produto');

// Rota: GET /api/clientes
exports.listarClientes = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;

    const pedidos = await Pedido.findAll({
      where: { UsuarioId: usuarioId },
      attributes: ['id', 'nome_cliente', 'telefone_cliente', 'valor_total', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    const porTelefone = new Map();
    for (const pedido of pedidos) {
      const chave = pedido.telefone_cliente || `sem-telefone-${pedido.nome_cliente}`;
      if (!porTelefone.has(chave)) {
        porTelefone.set(chave, {
          nome_cliente: pedido.nome_cliente,
          telefone_cliente: pedido.telefone_cliente,
          totalPedidos: 0,
          valorTotalGasto: 0,
          pedidosCancelados: 0,
          ultimoPedidoEm: pedido.createdAt,
        });
      }
      const cliente = porTelefone.get(chave);
      cliente.totalPedidos += 1;
      if (pedido.status === 'Cancelado') {
        cliente.pedidosCancelados += 1;
      } else {
        cliente.valorTotalGasto += Number(pedido.valor_total);
      }
      if (new Date(pedido.createdAt) > new Date(cliente.ultimoPedidoEm)) {
        cliente.ultimoPedidoEm = pedido.createdAt;
      }
    }

    const clientes = Array.from(porTelefone.values()).sort(
      (a, b) => new Date(b.ultimoPedidoEm) - new Date(a.ultimoPedidoEm)
    );

    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar clientes', error: error.message });
  }
};

// Rota: GET /api/clientes/:telefone/pedidos
// Histórico completo de pedidos de um cliente específico.
exports.historicoCliente = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    const { telefone } = req.params;

    let whereClause = { UsuarioId: usuarioId };

    // Correção: Trata casos de clientes que fizeram pedido sem telefone
    if (telefone.startsWith('sem-telefone-')) {
      whereClause.nome_cliente = telefone.replace('sem-telefone-', '');
      whereClause.telefone_cliente = null;
    } else {
      whereClause.telefone_cliente = telefone;
    }

    const pedidos = await Pedido.findAll({
      where: whereClause,
      include: [
        {
          model: PedidoItem,
          include: [{ model: Produto, attributes: ['id', 'nome'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar histórico do cliente', error: error.message });
  }
};