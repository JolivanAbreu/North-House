const Categoria = require('../models/Categoria');

// Criar Categoria
exports.createCategoria = async (req, res) => {
  try {
    const { nome, tipo } = req.body;
    const usuarioId = req.userData.lojaId;

    const novaCategoria = await Categoria.create({
      nome,
      tipo: tipo === 'mercearia' ? 'mercearia' : 'cardapio',
      UsuarioId: usuarioId,
    });
    res.status(201).json(novaCategoria);
  } catch (error) {
    console.error('ERRO EM createCategoria:', error);
    res.status(500).json({ message: 'Erro ao criar categoria', error: error.message });
  }
};

// Listar Categorias do usuário logado
exports.getCategorias = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    const categorias = await Categoria.findAll({
      where: { UsuarioId: usuarioId },
    });
    res.status(200).json(categorias);
  } catch (error) {
    console.error('ERRO EM getCategorias:', error);
    res.status(500).json({ message: 'Erro ao buscar categorias', error: error.message });
  }
};

// Editar Categoria
exports.updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo } = req.body;
    const usuarioId = req.userData.lojaId;

    const dados = { nome };
    if (tipo !== undefined) {
      dados.tipo = tipo === 'mercearia' ? 'mercearia' : 'cardapio';
    }

    const [updated] = await Categoria.update(dados, {
      where: { id: id, UsuarioId: usuarioId },
    });

    if (updated) {
      const categoriaAtualizada = await Categoria.findOne({ where: { id: id } });
      res.status(200).json(categoriaAtualizada);
    } else {
      res.status(404).json({ message: 'Categoria não encontrada ou não pertence a você.' });
    }
  } catch (error) {
    console.error('ERRO EM updateCategoria:', error);
    res.status(500).json({ message: 'Erro ao atualizar categoria', error: error.message });
  }
};

// Deletar Categoria
exports.deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.userData.lojaId;

    const deleted = await Categoria.destroy({
      where: { id: id, UsuarioId: usuarioId },
    });

    if (deleted) {
      res.status(204).json({ message: 'Categoria deletada com sucesso.' });
    } else {
      res.status(404).json({ message: 'Categoria não encontrada ou não pertence a você.' });
    }
  } catch (error) {
    console.error('ERRO EM deleteCategoria:', error);
    res.status(500).json({ message: 'Erro ao deletar categoria', error: error.message });
  }
};