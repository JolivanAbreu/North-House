  const Pedido = require('../models/Pedido');
  const PedidoItem = require('../models/PedidoItem');
  const Produto = require('../models/Produto');
  const Categoria = require('../models/Categoria');
  const VariacaoProduto = require('../models/VariacaoProduto');
  const Mesa = require('../models/Mesa');
  const Insumo = require('../models/Insumo');
  const FichaTecnica = require('../models/FichaTecnica');
  const Usuario = require('../models/Usuario');
  const sequelize = require('../database/config');
  const { Op } = require('sequelize');

  // Arquiva "por baixo dos panos" pedidos Concluído/Cancelado mais antigos que o
  // prazo configurado pela loja (dias_para_arquivar_pedidos). Não precisa de nenhum
  // agendador externo: roda toda vez que a lista de pedidos é carregada.
  const arquivarPedidosVencidos = async (usuarioId) => {
    const usuario = await Usuario.findByPk(usuarioId, { attributes: ['dias_para_arquivar_pedidos'] });
    const dias = usuario?.dias_para_arquivar_pedidos ?? 30;

    const limite = new Date();
    limite.setDate(limite.getDate() - dias);

    await Pedido.update(
      { arquivado_em: new Date() },
      {
        where: {
          UsuarioId: usuarioId,
          status: { [Op.in]: ['Concluído', 'Cancelado'] },
          arquivado_em: null,
          updatedAt: { [Op.lt]: limite },
        },
      }
    );
  };

  // Rota: GET /api/pedidos/admin
  // Lista pedidos do MEI logado. Por padrão esconde os arquivados;
  // passe ?incluirArquivados=true pra ver todos (usado nos Relatórios).
  exports.getPedidosAdmin = async (req, res) => {
    try {
      const usuarioId = req.userData.lojaId;
      const incluirArquivados = req.query.incluirArquivados === 'true';

      await arquivarPedidosVencidos(usuarioId);

      const where = { UsuarioId: usuarioId };
      if (!incluirArquivados) {
        where.arquivado_em = null;
      }

      const pedidos = await Pedido.findAll({
        where,
        include: [
          {
            model: PedidoItem,
            include: [{
              model: Produto,
              attributes: ['id', 'nome'],
              include: [{ model: Categoria, attributes: ['id', 'nome', 'tipo'] }]
            }]
          },
          { model: Mesa, attributes: ['id', 'numero', 'status'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json(pedidos);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
    }
  };

  // Rota: PUT /api/pedidos/admin/:id/desarquivar
  exports.desarquivarPedido = async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.userData.lojaId;

      const pedido = await Pedido.findOne({ where: { id, UsuarioId: usuarioId } });
      if (!pedido) {
        return res.status(404).json({ message: 'Pedido não encontrado.' });
      }

      await pedido.update({ arquivado_em: null });
      res.status(200).json(pedido);
    } catch (error) {
      console.error('ERRO EM desarquivarPedido:', error);
      res.status(500).json({ message: 'Erro ao desarquivar pedido', error: error.message });
    }
  };

  // Rota: PUT /api/pedidos/admin/:id/status
  // Função agora controla o estoque
  exports.updatePedidoStatus = async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { status: novoStatus } = req.body;
      const usuarioId = req.userData.lojaId;

      const pedido = await Pedido.findOne({
        where: { id: id, UsuarioId: usuarioId },
        include: [PedidoItem],
        transaction: t
      });

      if (!pedido) {
        await t.rollback();
        return res.status(404).json({ message: 'Pedido não encontrado.' });
      }

      const statusAntigo = pedido.status;

      pedido.status = novoStatus;
      await pedido.save({ transaction: t });

      await t.commit();

      res.status(200).json(pedido);

    } catch (error) {
      // Protege contra o caso raro da transação já ter sido finalizada
      // (ex: chamadas concorrentes para o mesmo pedido).
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Aviso: falha ao reverter transação (provavelmente já finalizada):', rollbackError.message);
      }

      if (error.message.includes('Estoque insuficiente') || error.message.includes('não encontrado')) {
        return res.status(400).json({ message: error.message });
      }

      console.error('ERRO EM updatePedidoStatus:', error);
      res.status(500).json({ message: 'Erro ao atualizar status do pedido', error: error.message });
    }
  };
  // Rota: DELETE /api/pedidos/admin/:id
  // Só permite excluir pedidos que já chegaram a um estado final
  // (Concluído ou Cancelado), pra evitar apagar um pedido em andamento por engano.
  exports.deletePedido = async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { id } = req.params;
      const usuarioId = req.userData.lojaId;

      const pedido = await Pedido.findOne({
        where: { id, UsuarioId: usuarioId },
        transaction: t
      });

      if (!pedido) {
        await t.rollback();
        return res.status(404).json({ message: 'Pedido não encontrado.' });
      }

      if (!['Concluído', 'Cancelado'].includes(pedido.status)) {
        await t.rollback();
        return res.status(400).json({
          message: 'Só é possível excluir pedidos que já foram Concluídos ou Cancelados.'
        });
      }

      await PedidoItem.destroy({ where: { PedidoId: id }, transaction: t });
      await pedido.destroy({ transaction: t });

      await t.commit();
      res.status(204).send();

    } catch (error) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Aviso: falha ao reverter transação:', rollbackError.message);
      }
      console.error('ERRO EM deletePedido:', error);
      res.status(500).json({ message: 'Erro ao excluir pedido', error: error.message });
    }
  };

  // --- Comandas locais (restaurante) ---

  // Recalcula subtotal/valor_total de uma comanda a partir dos seus itens.
  const recalcularTotais = async (pedidoId, transaction) => {
    const itens = await PedidoItem.findAll({ where: { PedidoId: pedidoId }, transaction });
    const subtotal = itens.reduce(
      (acc, item) => acc + parseFloat(item.preco_unitario) * parseFloat(item.quantidade),
      0
    );
    const pedido = await Pedido.findByPk(pedidoId, { transaction });
    const valor_desconto = parseFloat(pedido.valor_desconto || 0);
    const valor_total = Math.max(0, parseFloat((subtotal - valor_desconto).toFixed(2)));

    await pedido.update({ subtotal: parseFloat(subtotal.toFixed(2)), valor_total }, { transaction });
    return pedido;
  };

  const TIPOS_COMANDA = ['Local', 'Delivery', 'Retirada'];

  // Rota: POST /api/pedidos/admin
  // Abre uma comanda direto pelo staff (o Casa Nova não tem vitrine pública).
  // - Local: cliente e mesa opcionais, sem telefone.
  // - Delivery / Retirada: pedidos recebidos por telefone/WhatsApp, com
  //   telefone do cliente (e endereço, no delivery).
  exports.createComandaLocal = async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const usuarioId = req.userData.lojaId;
      const { nome_cliente, telefone_cliente, mesaId, endereco_entrega } = req.body;
      const tipo_entrega = TIPOS_COMANDA.includes(req.body.tipo_entrega) ? req.body.tipo_entrega : 'Local';
      const ehLocal = tipo_entrega === 'Local';

      if (!ehLocal && !String(telefone_cliente || '').replace(/\D/g, '')) {
        await t.rollback();
        return res.status(400).json({ message: 'Informe o telefone do cliente.' });
      }
      if (tipo_entrega === 'Delivery' && !String(endereco_entrega || '').trim()) {
        await t.rollback();
        return res.status(400).json({ message: 'Informe o endereço de entrega.' });
      }

      let mesa = null;
      if (mesaId && ehLocal) {
        mesa = await Mesa.findOne({ where: { id: mesaId, UsuarioId: usuarioId }, transaction: t });
        if (!mesa) {
          await t.rollback();
          return res.status(404).json({ message: 'Mesa não encontrada.' });
        }
        if (mesa.status === 'ocupada') {
          await t.rollback();
          return res.status(400).json({ message: 'Essa mesa já está ocupada por outra comanda.' });
        }
      }

      const novaComanda = await Pedido.create({
        nome_cliente: nome_cliente?.trim() || (ehLocal ? 'Comanda Local' : 'Cliente'),
        telefone_cliente: ehLocal ? null : String(telefone_cliente).replace(/\D/g, ''),
        endereco_entrega: tipo_entrega === 'Delivery' ? String(endereco_entrega).trim() : null,
        tipo_entrega,
        forma_pagamento_ilustrativa: null,
        status: 'Em preparo',
        pago: false,
        subtotal: 0,
        valor_desconto: 0,
        valor_total: 0,
        UsuarioId: usuarioId,
        MesaId: mesa ? mesa.id : null,
        mesa_numero: mesa ? mesa.numero : null,
      }, { transaction: t });

      if (mesa) {
        await mesa.update({ status: 'ocupada' }, { transaction: t });
      }

      await t.commit();

      const comandaCompleta = await Pedido.findByPk(novaComanda.id, {
        include: [
          { model: PedidoItem, include: [{ model: Produto, attributes: ['id', 'nome'], include: [{ model: Categoria, attributes: ['id', 'nome', 'tipo'] }] }] },
          { model: Mesa, attributes: ['id', 'numero', 'status'] },
        ],
      });
      res.status(201).json(comandaCompleta);
    } catch (error) {
      await t.rollback();
      console.error('ERRO EM createComandaLocal:', error);
      res.status(500).json({ message: 'Erro ao abrir comanda', error: error.message });
    }
  };

  // Rota: POST /api/pedidos/admin/:id/itens
  // Adiciona um item (produto + quantidade) a uma comanda ainda aberta (não paga),
  // recalculando o subtotal automaticamente.
  exports.addItemComanda = async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { produtoId, quantidade, variacaoId } = req.body;
      const usuarioId = req.userData.lojaId;

      const pedido = await Pedido.findOne({ where: { id, UsuarioId: usuarioId }, transaction: t });
      if (!pedido) {
        await t.rollback();
        return res.status(404).json({ message: 'Comanda não encontrada.' });
      }
      if (pedido.pago) {
        await t.rollback();
        return res.status(400).json({ message: 'Essa comanda já foi paga e finalizada. Reabra a comanda para editar os itens.' });
      }
      if (!produtoId || !quantidade || parseFloat(quantidade) <= 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Informe o produto e uma quantidade válida.' });
      }

      const produto = await Produto.findOne({
        where: { id: produtoId, UsuarioId: usuarioId },
        include: [{ model: VariacaoProduto, attributes: ['id', 'nome', 'ajuste_preco'] }],
        transaction: t,
      });
      if (!produto) {
        await t.rollback();
        return res.status(404).json({ message: 'Produto não encontrado.' });
      }

      let precoUnitario = parseFloat(produto.preco_venda);
      let variacaoEscolhida = null;
      if (variacaoId) {
        variacaoEscolhida = produto.VariacaoProdutos?.find((v) => v.id === parseInt(variacaoId));
        if (!variacaoEscolhida) {
          await t.rollback();
          return res.status(400).json({ message: 'Variação inválida para esse produto.' });
        }
        precoUnitario += parseFloat(variacaoEscolhida.ajuste_preco);
      }

      await PedidoItem.create({
        PedidoId: pedido.id,
        ProdutoId: produto.id,
        quantidade: parseFloat(quantidade),
        preco_unitario: precoUnitario,
        variacao_nome: variacaoEscolhida ? variacaoEscolhida.nome : null,
        variacao_ajuste_preco: variacaoEscolhida ? variacaoEscolhida.ajuste_preco : null,
      }, { transaction: t });

      await recalcularTotais(pedido.id, t);
      await t.commit();

      const comandaAtualizada = await Pedido.findByPk(pedido.id, {
        include: [
          { model: PedidoItem, include: [{ model: Produto, attributes: ['id', 'nome'], include: [{ model: Categoria, attributes: ['id', 'nome', 'tipo'] }] }] },
          { model: Mesa, attributes: ['id', 'numero', 'status'] },
        ],
      });
      res.status(200).json(comandaAtualizada);
    } catch (error) {
      await t.rollback();
      console.error('ERRO EM addItemComanda:', error);
      res.status(500).json({ message: 'Erro ao adicionar item à comanda', error: error.message });
    }
  };

  // Rota: PUT /api/pedidos/admin/:id/itens/:itemId
  // Altera a quantidade de um item já lançado (botões + / - da comanda).
  exports.updateItemComanda = async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id, itemId } = req.params;
      const quantidade = parseFloat(req.body.quantidade);
      const usuarioId = req.userData.lojaId;

      if (!quantidade || quantidade <= 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Informe uma quantidade válida.' });
      }

      const pedido = await Pedido.findOne({ where: { id, UsuarioId: usuarioId }, transaction: t });
      if (!pedido) {
        await t.rollback();
        return res.status(404).json({ message: 'Comanda não encontrada.' });
      }
      if (pedido.pago) {
        await t.rollback();
        return res.status(400).json({ message: 'Essa comanda já foi paga e finalizada. Reabra a comanda para editar os itens.' });
      }

      const item = await PedidoItem.findOne({ where: { id: itemId, PedidoId: pedido.id }, transaction: t });
      if (!item) {
        await t.rollback();
        return res.status(404).json({ message: 'Item não encontrado nessa comanda.' });
      }

      await item.update({ quantidade }, { transaction: t });
      await recalcularTotais(pedido.id, t);
      await t.commit();

      const comandaAtualizada = await Pedido.findByPk(pedido.id, {
        include: [
          { model: PedidoItem, include: [{ model: Produto, attributes: ['id', 'nome'], include: [{ model: Categoria, attributes: ['id', 'nome', 'tipo'] }] }] },
          { model: Mesa, attributes: ['id', 'numero', 'status'] },
        ],
      });
      res.status(200).json(comandaAtualizada);
    } catch (error) {
      await t.rollback();
      console.error('ERRO EM updateItemComanda:', error);
      res.status(500).json({ message: 'Erro ao alterar item da comanda', error: error.message });
    }
  };

  // Rota: DELETE /api/pedidos/admin/:id/itens/:itemId
  exports.removeItemComanda = async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id, itemId } = req.params;
      const usuarioId = req.userData.lojaId;

      const pedido = await Pedido.findOne({ where: { id, UsuarioId: usuarioId }, transaction: t });
      if (!pedido) {
        await t.rollback();
        return res.status(404).json({ message: 'Comanda não encontrada.' });
      }
      if (pedido.pago) {
        await t.rollback();
        return res.status(400).json({ message: 'Essa comanda já foi paga e finalizada. Reabra a comanda para editar os itens.' });
      }

      const item = await PedidoItem.findOne({ where: { id: itemId, PedidoId: pedido.id }, transaction: t });
      if (!item) {
        await t.rollback();
        return res.status(404).json({ message: 'Item não encontrado nessa comanda.' });
      }

      await item.destroy({ transaction: t });
      await recalcularTotais(pedido.id, t);
      await t.commit();

      const comandaAtualizada = await Pedido.findByPk(pedido.id, {
        include: [
          { model: PedidoItem, include: [{ model: Produto, attributes: ['id', 'nome'], include: [{ model: Categoria, attributes: ['id', 'nome', 'tipo'] }] }] },
          { model: Mesa, attributes: ['id', 'numero', 'status'] },
        ],
      });
      res.status(200).json(comandaAtualizada);
    } catch (error) {
      await t.rollback();
      console.error('ERRO EM removeItemComanda:', error);
      res.status(500).json({ message: 'Erro ao remover item da comanda', error: error.message });
    }
  };

  // Rota: PUT /api/pedidos/admin/:id/finalizar
  // Confirma a forma de pagamento, marca a comanda como paga/concluída,
  // dá baixa de estoque (mesma lógica de updatePedidoStatus) e libera a mesa.
  exports.finalizarComanda = async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { forma_pagamento } = req.body;
      const usuarioId = req.userData.lojaId;

      const pedido = await Pedido.findOne({
        where: { id, UsuarioId: usuarioId },
        include: [PedidoItem, Mesa],
        transaction: t,
      });
      if (!pedido) {
        await t.rollback();
        return res.status(404).json({ message: 'Comanda não encontrada.' });
      }
      if (pedido.pago) {
        await t.rollback();
        return res.status(400).json({ message: 'Essa comanda já está paga.' });
      }
      if (!pedido.PedidoItems || pedido.PedidoItems.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Adicione ao menos um item antes de finalizar a comanda.' });
      }
      if (!forma_pagamento) {
        await t.rollback();
        return res.status(400).json({ message: 'Selecione a forma de pagamento.' });
      }

      // Baixa de estoque do próprio produto (mercearia), controlada por item vendido.
      for (const item of pedido.PedidoItems) {
        const produto = await Produto.findByPk(item.ProdutoId, { transaction: t });
        if (produto && produto.quantidade_em_estoque !== null) {
          await produto.decrement('quantidade_em_estoque', { by: parseFloat(item.quantidade), transaction: t });
        }
      }

      await pedido.update({
        pago: true,
        status: 'Concluído',
        forma_pagamento_ilustrativa: forma_pagamento,
      }, { transaction: t });

      if (pedido.MesaId) {
        const mesa = await Mesa.findByPk(pedido.MesaId, { transaction: t });
        if (mesa) await mesa.update({ status: 'livre' }, { transaction: t });
      }

      await t.commit();

      const comandaFinalizada = await Pedido.findByPk(pedido.id, {
        include: [
          { model: PedidoItem, include: [{ model: Produto, attributes: ['id', 'nome'], include: [{ model: Categoria, attributes: ['id', 'nome', 'tipo'] }] }] },
          { model: Mesa, attributes: ['id', 'numero', 'status'] },
        ],
      });
      res.status(200).json(comandaFinalizada);
    } catch (error) {
      try { await t.rollback(); } catch (e) { /* ignore */ }
      if (error.message.includes('Estoque insuficiente')) {
        return res.status(400).json({ message: error.message });
      }
      console.error('ERRO EM finalizarComanda:', error);
      res.status(500).json({ message: 'Erro ao finalizar comanda', error: error.message });
    }
  };

  // Rota: PUT /api/pedidos/admin/:id/reabrir
  // Reabre uma comanda já finalizada (pago=true), caso o cliente peça algo a
  // mais ou tenha havido algum engano no pagamento. Re-ocupa a mesa, se livre.
  exports.reabrirComanda = async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const usuarioId = req.userData.lojaId;

      const pedido = await Pedido.findOne({ where: { id, UsuarioId: usuarioId }, transaction: t });
      if (!pedido) {
        await t.rollback();
        return res.status(404).json({ message: 'Comanda não encontrada.' });
      }

      await pedido.update({ pago: false, status: 'Em preparo', arquivado_em: null }, { transaction: t });

      if (pedido.MesaId) {
        const mesa = await Mesa.findByPk(pedido.MesaId, { transaction: t });
        if (mesa && mesa.status === 'livre') {
          await mesa.update({ status: 'ocupada' }, { transaction: t });
        }
      }

      await t.commit();
      res.status(200).json(pedido);
    } catch (error) {
      await t.rollback();
      console.error('ERRO EM reabrirComanda:', error);
      res.status(500).json({ message: 'Erro ao reabrir comanda', error: error.message });
    }
  };

  // Rota: POST /api/pedidos/admin/:id/pix
  // Gera um QR code Pix para a comanda (mesmo fluxo já usado no delivery),
  // permitindo cobrar Pix também nas comandas locais.
  exports.gerarPixComanda = async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.userData.lojaId;
      const { criarPagamentoPix } = require('./pagamentoController');

      const pedido = await Pedido.findOne({ where: { id, UsuarioId: usuarioId } });
      if (!pedido) {
        return res.status(404).json({ message: 'Comanda não encontrada.' });
      }

      try {
        await criarPagamentoPix(pedido);
      } catch (erroPagamento) {
        console.error('Aviso: falha ao gerar Pix real, seguindo com QR ilustrativo:', erroPagamento.message);
      }

      await pedido.reload();

      if (pedido.pix_qr_base64 && pedido.pix_copia_cola) {
        return res.status(200).json({
          qrCodeUrl: `data:image/png;base64,${pedido.pix_qr_base64}`,
          copiaECola: pedido.pix_copia_cola,
          real: true,
        });
      }

      const valorComoNumero = parseFloat(pedido.valor_total);
      const valorPix = valorComoNumero.toFixed(2).replace('.', '');
      const fakePixKey = `00020126580014br.gov.bcb.pix0136${pedido.status_token.substring(0, 20)}520400005303986540${valorPix}5802BR5913${(pedido.nome_cliente || 'Cliente').split(' ')[0]}6009SAO PAULO62070503***6304EAFB`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fakePixKey)}`;

      res.status(200).json({ qrCodeUrl, copiaECola: fakePixKey, real: false });
    } catch (error) {
      console.error('ERRO EM gerarPixComanda:', error);
      res.status(500).json({ message: 'Erro ao gerar Pix', error: error.message });
    }
  };
