const Pedido = require('../models/Pedido');

// Integração opcional com o Mercado Pago para gerar cobranças Pix reais.
// Se a variável MP_ACCESS_TOKEN não estiver configurada no .env, o sistema
// simplesmente continua usando o QR ilustrativo (comportamento original) -
// nada quebra pra quem não configurar isso.

let mpClient = null;
let mpPayment = null;

const getMercadoPago = () => {
  if (!process.env.MP_ACCESS_TOKEN) return null;

  if (!mpClient) {
    // Import tardio de propósito: evita exigir a lib se ninguém for usar Pix real.
    const { MercadoPagoConfig, Payment } = require('mercadopago');
    mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    mpPayment = new Payment(mpClient);
  }
  return mpPayment;
};

// Cria a cobrança Pix no Mercado Pago pro pedido recém-criado e salva o
// QR code / copia-e-cola / id do pagamento no próprio Pedido.
exports.criarPagamentoPix = async (pedido) => {
  const payment = getMercadoPago();
  if (!payment) return null; // Mercado Pago não configurado - segue com o QR ilustrativo

  const primeiroNome = pedido.nome_cliente.split(' ')[0] || 'Cliente';

  const resposta = await payment.create({
    body: {
      transaction_amount: parseFloat(pedido.valor_total),
      description: `Pedido #${pedido.id}`,
      payment_method_id: 'pix',
      payer: {
        first_name: primeiroNome,
        email: `pedido${pedido.id}@sememail.sgvmei.com`, // MP exige um e-mail; não coletamos e-mail do cliente
      },
      notification_url: process.env.MP_WEBHOOK_URL || undefined,
      external_reference: String(pedido.id),
    },
  });

  const dadosPix = resposta?.point_of_interaction?.transaction_data;
  if (dadosPix) {
    await pedido.update({
      pix_payment_id: String(resposta.id),
      pix_qr_base64: dadosPix.qr_code_base64,
      pix_copia_cola: dadosPix.qr_code,
    });
  }

  return resposta;
};

// Rota: POST /api/public/pagamentos/webhook
// O Mercado Pago chama essa URL automaticamente quando o status de um
// pagamento muda (ex: Pix foi pago).
exports.webhookMercadoPago = async (req, res) => {
  try {
    const payment = getMercadoPago();
    if (!payment) return res.status(200).send('ok'); // Mercado Pago não configurado

    const paymentId = req.body?.data?.id || req.query['data.id'];
    if (!paymentId) return res.status(200).send('ok');

    const info = await payment.get({ id: paymentId });

    if (info.status === 'approved') {
      const pedido = await Pedido.findOne({ where: { pix_payment_id: String(paymentId) } });
      if (pedido && pedido.status === 'Recebido') {
        // Pagamento confirmado: o pedido segue pro preparo automaticamente.
        await pedido.update({ status: 'Em preparo' });
      }
    }

    res.status(200).send('ok');
  } catch (error) {
    console.error('ERRO EM webhookMercadoPago:', error);
    // Sempre responde 200 pro Mercado Pago não ficar retentando indefinidamente
    res.status(200).send('erro processado');
  }
};
