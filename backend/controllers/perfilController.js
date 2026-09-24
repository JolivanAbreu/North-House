const Usuario = require('../models/Usuario');

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const horariosPadrao = () => {
  const padrao = {};
  DIAS_SEMANA.forEach((dia) => {
    padrao[dia] = { ativo: dia !== 'dom', abre: '08:00', fecha: '18:00' };
  });
  return padrao;
};

const parseHorarios = (raw) => {
  if (!raw) return horariosPadrao();
  try {
    return JSON.parse(raw);
  } catch {
    return horariosPadrao();
  }
};

// Rota: GET /api/perfil
// Busca os dados do perfil do usuário logado
exports.getPerfil = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId || req.userData.id;

    const perfil = await Usuario.findByPk(usuarioId, {
      attributes: [
        'nome_loja', 'telefone_whatsapp', 'link_instagram',
        'dias_para_arquivar_pedidos', 'horarios_funcionamento', 'loja_pausada'
      ]
    });

    if (!perfil) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const perfilPlano = perfil.get({ plain: true });
    perfilPlano.horarios_funcionamento = parseHorarios(perfilPlano.horarios_funcionamento);

    res.status(200).json(perfilPlano);

  } catch (error) {
    console.error('ERRO EM getPerfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil.', error: error.message });
  }
};

// Rota: PUT /api/perfil
// Atualiza os dados do perfil do usuário logado
exports.updatePerfil = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId || req.userData.id;
    const {
      nome_loja, telefone_whatsapp, link_instagram,
      dias_para_arquivar_pedidos, horarios_funcionamento, loja_pausada
    } = req.body;

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const telefoneLimpo = telefone_whatsapp ? telefone_whatsapp.replace(/\D/g, '') : null;

    const dadosParaAtualizar = {
      nome_loja,
      telefone_whatsapp: telefoneLimpo,
      link_instagram,
    };

    if (dias_para_arquivar_pedidos !== undefined) {
      dadosParaAtualizar.dias_para_arquivar_pedidos = parseInt(dias_para_arquivar_pedidos, 10) || 30;
    }
    if (horarios_funcionamento !== undefined) {
      dadosParaAtualizar.horarios_funcionamento = JSON.stringify(horarios_funcionamento);
    }
    if (loja_pausada !== undefined) {
      dadosParaAtualizar.loja_pausada = !!loja_pausada;
    }

    await usuario.update(dadosParaAtualizar);

    res.status(200).json({ message: 'Perfil atualizado com sucesso.' });

  } catch (error) {
    console.error('ERRO EM updatePerfil:', error);
    res.status(500).json({ message: 'Erro ao salvar perfil.', error: error.message });
  }
};

exports.parseHorarios = parseHorarios;
exports.DIAS_SEMANA = DIAS_SEMANA;
