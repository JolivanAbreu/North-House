const PushSubscription = require('../models/PushSubscription');
const { vapidDisponivel } = require('../utils/push');

// Rota: GET /api/push/vapid-public-key
exports.getChavePublica = (req, res) => {
  res.status(200).json({
    disponivel: vapidDisponivel(),
    chave: process.env.VAPID_PUBLIC_KEY || null,
  });
};

// Rota: POST /api/push/inscrever
exports.inscrever = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Inscrição de push inválida.' });
    }

    const [subscription] = await PushSubscription.findOrCreate({
      where: { endpoint },
      defaults: { endpoint, p256dh: keys.p256dh, auth: keys.auth, UsuarioId: usuarioId },
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar inscrição de push', error: error.message });
  }
};

// Rota: POST /api/push/desinscrever
exports.desinscrever = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.destroy({ where: { endpoint } });
    res.status(200).json({ message: 'Inscrição removida.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover inscrição de push', error: error.message });
  }
};
