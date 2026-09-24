// Notificações push reais via Web Push (PWA). Só funciona se as chaves VAPID
// estiverem configuradas no .env (gere com: npx web-push generate-vapid-keys).
// Sem elas, o sistema simplesmente não envia push (sem quebrar nada) — o
// alerta sonoro/visual dentro do painel continua funcionando normalmente.
let configurado = false;

const configurar = () => {
  if (configurado) return true;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;

  const webpush = require('web-push');
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contato@sgvmei.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  configurado = true;
  return true;
};

exports.vapidDisponivel = () => Boolean(process.env.VAPID_PUBLIC_KEY);

exports.enviarPushNovoPedido = async (subscriptions, pedido) => {
  if (!configurar()) return;
  const webpush = require('web-push');

  const payload = JSON.stringify({
    titulo: 'Novo pedido recebido!',
    corpo: `${pedido.nome_cliente} - R$ ${Number(pedido.valor_total).toFixed(2)}`,
    pedidoId: pedido.id,
  });

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        .catch(async (error) => {
          // Inscrição expirada/inválida (410/404): remove do banco pra não tentar de novo.
          if (error.statusCode === 404 || error.statusCode === 410) {
            await sub.destroy();
          }
        })
    )
  );
};
