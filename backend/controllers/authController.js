const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { enviarEmailRedefinicaoSenha } = require('../utils/email');

// Rota de Registro (/api/registro)
exports.registro = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verifica se o usuário já existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'E-mail já cadastrado.' });
    }

    // Cria o usuário
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha_hash: senha,
    });

    res.status(201).json({ message: 'Usuário registrado com sucesso!', usuarioId: novoUsuario.id });

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Rota de Login (/api/login)
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Busca o usuário pelo e-mail
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Valida a senha
    const senhaValida = await usuario.validarSenha(senha);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Loja pausada não impede o dono/atendentes de logar, só a vitrine pública.

    const lojaId = usuario.role === 'atendente' ? usuario.UsuarioDonoId : usuario.id;

    // Gera o token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role, lojaId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token: token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
    });

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Rota: POST /api/esqueci-senha
// Sempre responde com sucesso, mesmo se o e-mail não existir, pra não revelar
// quais e-mails estão cadastrados no sistema.
exports.esqueciSenha = async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });

    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await usuario.update({
        reset_senha_token: token,
        reset_senha_expira: expira,
      });

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const link = `${baseUrl}/redefinir-senha/${token}`;

      await enviarEmailRedefinicaoSenha({ para: usuario.email, nome: usuario.nome, link });
    }

    res.status(200).json({ message: 'Se o e-mail existir, enviamos um link de redefinição de senha.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// Rota: POST /api/redefinir-senha/:token
exports.redefinirSenha = async (req, res) => {
  try {
    const { token } = req.params;
    const { novaSenha } = req.body;

    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ message: 'A nova senha precisa ter pelo menos 6 caracteres.' });
    }

    const usuario = await Usuario.findOne({
      where: { reset_senha_token: token },
    });

    if (!usuario || !usuario.reset_senha_expira || usuario.reset_senha_expira < new Date()) {
      return res.status(400).json({ message: 'Link inválido ou expirado. Solicite uma nova redefinição.' });
    }

    usuario.senha_hash = novaSenha; // hook do model faz o hash
    usuario.reset_senha_token = null;
    usuario.reset_senha_expira = null;
    await usuario.save();

    res.status(200).json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};
