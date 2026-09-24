const Cupom = require('../models/Cupom');

// --- ADMIN: Listar cupons do MEI logado ---
exports.getCupons = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    const cupons = await Cupom.findAll({
      where: { UsuarioId: usuarioId },
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(cupons);
  } catch (error) {
    console.error('ERRO EM getCupons:', error);
    res.status(500).json({ message: 'Erro ao buscar cupons', error: error.message });
  }
};

// --- ADMIN: Criar cupom ---
exports.createCupom = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    const { codigo, tipo, valor, validade, usos_max, pedido_minimo, ativo } = req.body;

    if (!codigo || !valor) {
      return res.status(400).json({ message: 'Código e valor são obrigatórios.' });
    }

    const codigoNormalizado = codigo.trim().toUpperCase();

    const existente = await Cupom.findOne({
      where: { UsuarioId: usuarioId, codigo: codigoNormalizado }
    });
    if (existente) {
      return res.status(400).json({ message: 'Já existe um cupom com este código.' });
    }

    const novoCupom = await Cupom.create({
      codigo: codigoNormalizado,
      tipo: tipo === 'fixo' ? 'fixo' : 'percentual',
      valor,
      validade: validade || null,
      usos_max: usos_max || null,
      pedido_minimo: pedido_minimo || 0,
      ativo: ativo !== undefined ? ativo : true,
      UsuarioId: usuarioId,
    });

    res.status(201).json(novoCupom);
  } catch (error) {
    console.error('ERRO EM createCupom:', error);
    res.status(500).json({ message: 'Erro ao criar cupom', error: error.message });
  }
};

// --- ADMIN: Atualizar cupom ---
exports.updateCupom = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.userData.lojaId;
    const { codigo, tipo, valor, validade, usos_max, pedido_minimo, ativo } = req.body;

    const cupom = await Cupom.findOne({ where: { id, UsuarioId: usuarioId } });
    if (!cupom) {
      return res.status(404).json({ message: 'Cupom não encontrado.' });
    }

    if (codigo) cupom.codigo = codigo.trim().toUpperCase();
    if (tipo) cupom.tipo = tipo;
    if (valor !== undefined) cupom.valor = valor;
    cupom.validade = validade || null;
    cupom.usos_max = usos_max || null;
    if (pedido_minimo !== undefined) cupom.pedido_minimo = pedido_minimo;
    if (ativo !== undefined) cupom.ativo = ativo;

    await cupom.save();
    res.status(200).json(cupom);
  } catch (error) {
    console.error('ERRO EM updateCupom:', error);
    res.status(500).json({ message: 'Erro ao atualizar cupom', error: error.message });
  }
};

// --- ADMIN: Deletar cupom ---
exports.deleteCupom = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.userData.lojaId;

    const deleted = await Cupom.destroy({ where: { id, UsuarioId: usuarioId } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Cupom não encontrado.' });
    }
  } catch (error) {
    console.error('ERRO EM deleteCupom:', error);
    res.status(500).json({ message: 'Erro ao deletar cupom', error: error.message });
  }
};

// Função auxiliar (usada também pelo checkout) para validar um cupom e calcular o desconto
exports.validarCupomInterno = async (usuarioId, codigo, subtotal) => {
  if (!codigo) return { valido: false, motivo: 'Nenhum código informado.' };

  const cupom = await Cupom.findOne({
    where: { UsuarioId: usuarioId, codigo: codigo.trim().toUpperCase() }
  });

  if (!cupom) return { valido: false, motivo: 'Cupom não encontrado.' };
  if (!cupom.ativo) return { valido: false, motivo: 'Este cupom não está mais ativo.' };
  if (cupom.validade && new Date(cupom.validade) < new Date()) {
    return { valido: false, motivo: 'Este cupom expirou.' };
  }
  if (cupom.usos_max && cupom.usos_atual >= cupom.usos_max) {
    return { valido: false, motivo: 'Este cupom atingiu o limite de usos.' };
  }
  if (parseFloat(subtotal) < parseFloat(cupom.pedido_minimo)) {
    return {
      valido: false,
      motivo: `Pedido mínimo de R$ ${parseFloat(cupom.pedido_minimo).toFixed(2)} para usar este cupom.`
    };
  }

  let desconto = 0;
  if (cupom.tipo === 'percentual') {
    desconto = (parseFloat(subtotal) * parseFloat(cupom.valor)) / 100;
  } else {
    desconto = parseFloat(cupom.valor);
  }
  // Desconto nunca deixa o total negativo
  desconto = Math.min(desconto, parseFloat(subtotal));

  return { valido: true, cupom, desconto: parseFloat(desconto.toFixed(2)) };
};

// --- PÚBLICO: Validar cupom no carrinho (antes de fechar o pedido) ---
exports.validarCupomPublico = async (req, res) => {
  try {
    const { usuarioId, codigo, subtotal } = req.body;

    if (!usuarioId || !codigo || subtotal === undefined) {
      return res.status(400).json({ message: 'Dados incompletos para validar o cupom.' });
    }

    const resultado = await exports.validarCupomInterno(usuarioId, codigo, subtotal);

    if (!resultado.valido) {
      return res.status(400).json({ valido: false, message: resultado.motivo });
    }

    res.status(200).json({
      valido: true,
      codigo: resultado.cupom.codigo,
      tipo: resultado.cupom.tipo,
      valor: resultado.cupom.valor,
      desconto: resultado.desconto,
    });
  } catch (error) {
    console.error('ERRO EM validarCupomPublico:', error);
    res.status(500).json({ message: 'Erro ao validar cupom', error: error.message });
  }
};
