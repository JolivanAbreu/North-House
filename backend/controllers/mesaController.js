const Mesa = require('../models/Mesa');
const Pedido = require('../models/Pedido');

// Rota: GET /api/mesas
exports.getMesas = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    let mesas = await Mesa.findAll({
      where: { UsuarioId: usuarioId },
      order: [['numero', 'ASC']],
    });

    // Toda loja começa com 10 mesas cadastradas por padrão, pra não precisar
    // de uma tela de gerenciamento manual. Se a loja ainda não tem nenhuma
    // (conta nova, ou nunca usou mesas), semeamos 1 a 10 na primeira consulta.
    if (mesas.length === 0) {
      const mesasParaCriar = Array.from({ length: 10 }, (_, i) => ({
        numero: String(i + 1),
        UsuarioId: usuarioId,
      }));
      await Mesa.bulkCreate(mesasParaCriar);
      mesas = await Mesa.findAll({
        where: { UsuarioId: usuarioId },
        order: [['numero', 'ASC']],
      });
    }

    res.status(200).json(mesas);
  } catch (error) {
    console.error('ERRO EM getMesas:', error);
    res.status(500).json({ message: 'Erro ao buscar mesas', error: error.message });
  }
};

// Rota: POST /api/mesas
exports.createMesa = async (req, res) => {
  try {
    const { numero } = req.body;
    const usuarioId = req.userData.lojaId;

    if (!numero) {
      return res.status(400).json({ message: 'Informe o número/identificação da mesa.' });
    }

    const novaMesa = await Mesa.create({ numero, UsuarioId: usuarioId });
    res.status(201).json(novaMesa);
  } catch (error) {
    console.error('ERRO EM createMesa:', error);
    res.status(500).json({ message: 'Erro ao criar mesa', error: error.message });
  }
};

// Rota: PUT /api/mesas/:id
exports.updateMesa = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, status } = req.body;
    const usuarioId = req.userData.lojaId;

    const mesa = await Mesa.findOne({ where: { id, UsuarioId: usuarioId } });
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    const dados = {};
    if (numero !== undefined) dados.numero = numero;
    if (status !== undefined) dados.status = status;

    await mesa.update(dados);
    res.status(200).json(mesa);
  } catch (error) {
    console.error('ERRO EM updateMesa:', error);
    res.status(500).json({ message: 'Erro ao atualizar mesa', error: error.message });
  }
};

// Rota: DELETE /api/mesas/:id
exports.deleteMesa = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.userData.lojaId;

    const mesa = await Mesa.findOne({ where: { id, UsuarioId: usuarioId } });
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa não encontrada.' });
    }

    const comandaAberta = await Pedido.findOne({
      where: { MesaId: id, UsuarioId: usuarioId, pago: false },
    });
    if (comandaAberta) {
      return res.status(400).json({ message: 'Essa mesa tem uma comanda em aberto. Finalize a comanda antes de excluir a mesa.' });
    }

    await mesa.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('ERRO EM deleteMesa:', error);
    res.status(500).json({ message: 'Erro ao excluir mesa', error: error.message });
  }
};
