const Usuario = require('../models/Usuario');

// Rota: GET /api/equipe
// Lista os atendentes vinculados à loja do dono logado.
exports.listarEquipe = async (req, res) => {
  try {
    const donoId = req.userData.lojaId;
    const atendentes = await Usuario.findAll({
      where: { UsuarioDonoId: donoId },
      attributes: ['id', 'nome', 'email', 'createdAt'],
      order: [['nome', 'ASC']],
    });
    res.status(200).json(atendentes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar equipe', error: error.message });
  }
};

// Rota: POST /api/equipe
// Cria um novo login de atendente para a loja do dono logado.
exports.criarAtendente = async (req, res) => {
  try {
    const donoId = req.userData.lojaId;
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ message: 'A senha precisa ter pelo menos 6 caracteres.' });
    }

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ message: 'Já existe um usuário com esse e-mail.' });
    }

    const atendente = await Usuario.create({
      nome,
      email,
      senha_hash: senha,
      role: 'atendente',
      UsuarioDonoId: donoId,
    });

    res.status(201).json({
      id: atendente.id,
      nome: atendente.nome,
      email: atendente.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar atendente', error: error.message });
  }
};

// Rota: DELETE /api/equipe/:id
// Remove o acesso de um atendente. Só pode remover atendentes da própria loja.
exports.removerAtendente = async (req, res) => {
  try {
    const donoId = req.userData.lojaId;
    const { id } = req.params;

    const atendente = await Usuario.findOne({
      where: { id, UsuarioDonoId: donoId, role: 'atendente' },
    });

    if (!atendente) {
      return res.status(404).json({ message: 'Atendente não encontrado.' });
    }

    await atendente.destroy();
    res.status(200).json({ message: 'Atendente removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover atendente', error: error.message });
  }
};
