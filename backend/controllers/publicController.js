const Produto = require('../models/Produto');
const Categoria = require('../models/Categoria');
const Pedido = require('../models/Pedido');
const PedidoItem = require('../models/PedidoItem');
const Usuario = require('../models/Usuario');
const Cupom = require('../models/Cupom');
const VariacaoProduto = require('../models/VariacaoProduto');
const sequelize = require('../database/config');
const { Op } = require('sequelize');
const { validarCupomInterno } = require('./cupomController');
const { lojaEstaAberta } = require('../utils/horarioLoja');
const { criarPagamentoPix } = require('./pagamentoController');
const PushSubscription = require('../models/PushSubscription');
const { enviarPushNovoPedido } = require('../utils/push');

// Rota: GET /api/public/vitrine/:usuarioId
exports.getVitrine = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const usuario = await Usuario.findByPk(usuarioId, {
      attributes: [
        'id', 'nome', 'nome_loja', 'telefone_whatsapp', 'link_instagram',
        'horarios_funcionamento', 'loja_pausada'
      ]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Loja não encontrada.' });
    }

    const produtos = await Produto.findAll({
      where: { UsuarioId: usuarioId, disponivel: true },
      include: [
        { model: Categoria, attributes: ['id', 'nome', 'tipo'] },
        { model: VariacaoProduto, attributes: ['id', 'nome', 'ajuste_preco'] },
      ],
      order: [['nome', 'ASC']]
    });

    const categorias = await Categoria.findAll({
      where: { UsuarioId: usuarioId },
      order: [['nome', 'ASC']]
    });

    const statusLoja = lojaEstaAberta(usuario);

    res.status(200).json({
      loja: usuario,
      categorias,
      produtos,
      lojaAberta: statusLoja.aberta,
      motivoFechada: statusLoja.motivo || null,
    });

  } catch (error) {
    console.error('ERRO EM getVitrine:', error);
    res.status(500).json({ message: 'Erro ao buscar vitrine', error: error.message });
  }
};

// Rota: POST /api/public/pedidos
// Cliente finaliza o pedido
exports.createPedido = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { cliente, items, tipo_entrega, forma_pagamento, cupom_codigo, endereco_entrega } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'O carrinho não pode estar vazio.' });
    }

    if (tipo_entrega === 'Delivery' && !endereco_entrega) {
      return res.status(400).json({ message: 'Informe o endereço de entrega.' });
    }

    // --- 1. Identificar o Dono da Loja (MEI) e Validar Preços/Disponibilidade ---

    const primeiroProduto = await Produto.findByPk(items[0].produtoId);
    if (!primeiroProduto) {
      throw new Error('Produto não encontrado.');
    }
    const usuarioId = primeiroProduto.UsuarioId;

    // --- 1.1 Verificar se a loja está aberta ---
    const dono = await Usuario.findByPk(usuarioId);
    const statusLoja = lojaEstaAberta(dono);
    if (!statusLoja.aberta) {
      throw new Error(statusLoja.motivo || 'A loja está fechada no momento.');
    }

    const produtoIds = items.map(item => item.produtoId);

    const produtosDoBanco = await Produto.findAll({
      where: {
        id: { [Op.in]: produtoIds },
        UsuarioId: usuarioId
      },
      include: [{ model: VariacaoProduto, attributes: ['id', 'nome', 'ajuste_preco'] }]
    });

    if (produtosDoBanco.length !== produtoIds.length) {
      throw new Error('Pedido contém produtos inválidos ou de lojas diferentes.');
    }

    const indisponivel = produtosDoBanco.find(p => !p.disponivel);
    if (indisponivel) {
      throw new Error(`O produto "${indisponivel.nome}" não está disponível no momento.`);
    }

    // --- 2. Calcular o Subtotal (BACKEND), já considerando variações ---
    let subtotal = 0;
    const produtoMap = new Map(produtosDoBanco.map(p => [p.id, p]));
    const itensCalculados = [];

    for (const item of items) {
      const produto = produtoMap.get(item.produtoId);
      if (!produto) {
        throw new Error(`Produto com ID ${item.produtoId} não encontrado.`);
      }

      let precoUnitario = parseFloat(produto.preco_venda);
      let variacaoEscolhida = null;

      if (item.variacaoId) {
        variacaoEscolhida = produto.VariacaoProdutos?.find(v => v.id === item.variacaoId);
        if (!variacaoEscolhida) {
          throw new Error(`Variação inválida para o produto "${produto.nome}".`);
        }
        precoUnitario += parseFloat(variacaoEscolhida.ajuste_preco);
      }

      subtotal += precoUnitario * item.quantidade;
      itensCalculados.push({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        preco_unitario: precoUnitario,
        variacao_nome: variacaoEscolhida ? variacaoEscolhida.nome : null,
        variacao_ajuste_preco: variacaoEscolhida ? variacaoEscolhida.ajuste_preco : null,
      });
    }

    // --- 2.1 Validar e aplicar cupom (se houver) ---
    let valor_desconto = 0;
    let cupomAplicado = null;

    if (cupom_codigo) {
      const resultadoCupom = await validarCupomInterno(usuarioId, cupom_codigo, subtotal);
      if (!resultadoCupom.valido) {
        throw new Error(resultadoCupom.motivo || 'Cupom inválido.');
      }
      valor_desconto = resultadoCupom.desconto;
      cupomAplicado = resultadoCupom.cupom;
    }

    const valor_total_calculado = parseFloat((subtotal - valor_desconto).toFixed(2));

    // --- 3. Criar o Pedido ---
    const novoPedido = await Pedido.create({
      nome_cliente: cliente.nome,
      telefone_cliente: cliente.telefone,
      tipo_entrega: tipo_entrega,
      forma_pagamento_ilustrativa: forma_pagamento,
      endereco_entrega: tipo_entrega === 'Delivery' ? endereco_entrega : null,
      subtotal: subtotal,
      cupom_codigo: cupomAplicado ? cupomAplicado.codigo : null,
      valor_desconto: valor_desconto,
      valor_total: valor_total_calculado,
      UsuarioId: usuarioId,
      status: 'Recebido',
    }, { transaction: t });

    // --- 4. Criar os Itens do Pedido ---
    const pedidoItensData = itensCalculados.map(item => ({
      PedidoId: novoPedido.id,
      ProdutoId: item.produtoId,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      variacao_nome: item.variacao_nome,
      variacao_ajuste_preco: item.variacao_ajuste_preco,
    }));

    await PedidoItem.bulkCreate(pedidoItensData, { transaction: t });

    // --- 5. Registrar o uso do cupom ---
    if (cupomAplicado) {
      await Cupom.increment('usos_atual', {
        by: 1,
        where: { id: cupomAplicado.id },
        transaction: t
      });
    }

    await t.commit();

    // --- 6. Gera cobrança Pix real, se a loja tiver Mercado Pago configurado ---
    if (forma_pagamento === 'Pix') {
      try {
        await criarPagamentoPix(novoPedido);
      } catch (erroPagamento) {
        console.error('Aviso: falha ao criar cobrança Pix real, seguindo com o QR ilustrativo:', erroPagamento.message);
      }
    }

    // --- 7. Notifica o vendedor (push real), sem bloquear a resposta ao cliente ---
    try {
      const subscriptions = await PushSubscription.findAll({ where: { UsuarioId: dono.id } });
      if (subscriptions.length > 0) {
        await enviarPushNovoPedido(subscriptions, novoPedido);
      }
    } catch (erroPush) {
      console.error('Aviso: falha ao enviar notificação push:', erroPush.message);
    }

    res.status(201).json({
      message: 'Pedido recebido com sucesso!',
      statusToken: novoPedido.status_token
    });

  } catch (error) {
    await t.rollback();
    console.error("Erro em createPedido:", error);
    res.status(400).json({ message: error.message || 'Erro ao criar pedido' });
  }
};

// Rota: GET /api/public/pedidos/:token
//Função para o cliente buscar o status do pedido
exports.getPedidoStatus = async (req, res) => {
  try {
    const { token } = req.params;

    const pedido = await Pedido.findOne({
      where: { status_token: token },
      include: [
        {
          model: PedidoItem,
          include: [{ model: Produto, attributes: ['id', 'nome', 'imagem_url'] }]
        },
        {
          model: Usuario,
          attributes: ['id', 'nome_loja', 'telefone_whatsapp', 'link_instagram']
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    // --- LÓGICA DE PAGAMENTO ---
    let paymentInfo = null;

    if (pedido.status === 'Recebido' && pedido.forma_pagamento_ilustrativa === 'Pix') {
      if (pedido.pix_qr_base64 && pedido.pix_copia_cola) {
        // Cobrança Pix real (Mercado Pago)
        paymentInfo = {
          qrCodeUrl: `data:image/png;base64,${pedido.pix_qr_base64}`,
          copiaECola: pedido.pix_copia_cola,
          real: true,
        };
      } else {
        // Fallback ilustrativo (quando a loja não tem Mercado Pago configurado)
        const valorComoNumero = parseFloat(pedido.valor_total);
        const valorPix = valorComoNumero.toFixed(2).replace('.', '');
        const fakePixKey = `00020126580014br.gov.bcb.pix0136${pedido.status_token.substring(0, 20)}520400005303986540${valorPix}5802BR5913${pedido.nome_cliente.split(' ')[0]}6009SAO PAULO62070503***6304EAFB`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fakePixKey)}`;

        paymentInfo = {
          qrCodeUrl: qrCodeUrl,
          copiaECola: fakePixKey,
          real: false,
        };
      }
    }

    res.status(200).json({ ...pedido.get({ plain: true }), paymentInfo });

  } catch (error) {
    console.error('ERRO EM getPedidoStatus:', error);
    res.status(500).json({ message: 'Erro ao buscar status do pedido', error: error.message });
  }
};
