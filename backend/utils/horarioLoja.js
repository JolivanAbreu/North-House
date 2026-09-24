const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

// Verifica se a loja está aberta agora, considerando o horário configurado
// e o botão de "pausar loja" manual.
const lojaEstaAberta = (usuario) => {
  if (usuario.loja_pausada) {
    return { aberta: false, motivo: 'A loja está temporariamente fechada.' };
  }

  if (!usuario.horarios_funcionamento) {
    // Sem configuração = loja sempre aberta (comportamento antigo, continua funcionando).
    return { aberta: true };
  }

  let horarios;
  try {
    horarios = JSON.parse(usuario.horarios_funcionamento);
  } catch {
    return { aberta: true };
  }

  const agora = new Date();
  const diaAtual = DIAS_SEMANA[agora.getDay()];
  const configDia = horarios[diaAtual];

  if (!configDia || !configDia.ativo) {
    return { aberta: false, motivo: 'A loja não abre hoje.' };
  }

  const horaAtual = agora.getHours() * 60 + agora.getMinutes();
  const [horaAbre, minAbre] = (configDia.abre || '00:00').split(':').map(Number);
  const [horaFecha, minFecha] = (configDia.fecha || '23:59').split(':').map(Number);
  const minutosAbre = horaAbre * 60 + minAbre;
  const minutosFecha = horaFecha * 60 + minFecha;

  if (horaAtual < minutosAbre || horaAtual > minutosFecha) {
    return {
      aberta: false,
      motivo: `A loja abre das ${configDia.abre} às ${configDia.fecha} hoje.`
    };
  }

  return { aberta: true };
};

module.exports = { lojaEstaAberta, DIAS_SEMANA };
