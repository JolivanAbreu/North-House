// Restringe uma rota para que só o "dono" da loja possa acessar
// (atendentes ficam de fora). Usar sempre DEPOIS do checkAuth.
module.exports = (req, res, next) => {
  if (req.userData?.role !== 'dono') {
    return res.status(403).json({ message: 'Apenas o dono da loja pode fazer isso.' });
  }
  next();
};
