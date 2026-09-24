// Envio de e-mail para recuperação de senha.
// Se as variáveis SMTP_* não estiverem configuradas no .env, o sistema não
// quebra: registra o link no console do servidor para permitir testar em
// ambiente local sem precisar de uma conta de e-mail configurada.
let transporter = null;

const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
};

exports.enviarEmailRedefinicaoSenha = async ({ para, nome, link }) => {
  const mailer = getTransporter();

  if (!mailer) {
    // Modo de desenvolvimento/sem SMTP configurado: só loga o link.
    console.log(`[e-mail simulado] Redefinição de senha para ${para}: ${link}`);
    return { enviado: false };
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'nao-responda@sgvmei.com',
    to: para,
    subject: 'Redefinição de senha - SGV MEI',
    html: `
      <p>Olá, ${nome || ''}!</p>
      <p>Recebemos um pedido para redefinir sua senha. Clique no link abaixo para criar uma nova senha (válido por 1 hora):</p>
      <p><a href="${link}">${link}</a></p>
      <p>Se você não pediu isso, pode ignorar este e-mail.</p>
    `,
  });

  return { enviado: true };
};
