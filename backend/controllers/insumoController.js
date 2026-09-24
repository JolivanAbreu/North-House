const Insumo = require('../models/Insumo');

// Criar Insumo
exports.createInsumo = async (req, res) => {
  try {
    const {
      nome,
      unidade_uso,
      unidade_compra,
      custo_compra,
      fator_conversao
    } = req.body;

    const usuarioId = req.userData.lojaId;

    const novoInsumo = await Insumo.create({
      nome,
      unidade_uso,
      unidade_compra,
      custo_compra: parseFloat(custo_compra),
      fator_conversao: parseFloat(fator_conversao),
      quantidade_em_estoque: 0,
      UsuarioId: usuarioId,
    });
    res.status(201).json(novoInsumo);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar insumo', error: error.message });
  }
};

// Listar Insumos do usuário logado
exports.getInsumos = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    const insumos = await Insumo.findAll({
      where: { UsuarioId: usuarioId },
    });
    res.status(200).json(insumos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar insumos', error: error.message });
  }
};

// Editar Insumo
exports.updateInsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      unidade_uso,
      unidade_compra,
      custo_compra,
      fator_conversao
    } = req.body;
    const usuarioId = req.userData.lojaId;

    const [updated] = await Insumo.update({
      nome,
      unidade_uso,
      unidade_compra,
      custo_compra: parseFloat(custo_compra),
      fator_conversao: parseFloat(fator_conversao)
    }, {
      where: { id: id, UsuarioId: usuarioId },
    });

    if (updated) {
      const insumoAtualizado = await Insumo.findOne({ where: { id: id } });
      res.status(200).json(insumoAtualizado);
    } else {
      res.status(404).json({ message: 'Insumo não encontrado ou não pertence a você.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar insumo', error: error.message });
  }
};

// Deletar Insumo
exports.deleteInsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.userData.lojaId;

    const deleted = await Insumo.destroy({
      where: { id: id, UsuarioId: usuarioId },
    });

    if (deleted) {
      res.status(204).json({ message: 'Insumo deletado com sucesso.' });
    } else {
      res.status(404).json({ message: 'Insumo não encontrado ou não pertence a você.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar insumo', error: error.message });
  }
};

// Função para adicionar estoque (Stock-In)
exports.adicionarEstoque = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade_adicionada } = req.body;
    const usuarioId = req.userData.lojaId;

    if (!quantidade_adicionada || isNaN(quantidade_adicionada) || quantidade_adicionada <= 0) {
      return res.status(400).json({ message: 'Quantidade inválida.' });
    }

    const insumo = await Insumo.findOne({ where: { id: id, UsuarioId: usuarioId } });
    if (!insumo) {
      return res.status(404).json({ message: 'Insumo não encontrado.' });
    }

    await insumo.increment('quantidade_em_estoque', {
      by: parseFloat(quantidade_adicionada)
    });

    await insumo.reload();

    res.status(200).json(insumo);

  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar estoque', error: error.message });
  }
};