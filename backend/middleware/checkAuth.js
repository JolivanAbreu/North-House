const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Pega o token do header 'Authorization: Bearer TOKEN'
    const token = req.headers.authorization.split(' ')[1];
    
    // Verifica o token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adiciona os dados do usuário (payload do token) ao objeto 'req'
    // lojaId é sempre o id do "dono": se quem logou é o próprio dono, é o
    // próprio id; se é um atendente, é o id do dono ao qual ele pertence.
    // Isso permite que atendentes enxerguem os mesmos dados da loja sem
    // duplicar cadastro de produtos/insumos/pedidos por usuário.
    req.userData = {
      email: decodedToken.email,
      id: decodedToken.id,
      role: decodedToken.role || 'dono',
      lojaId: decodedToken.lojaId || decodedToken.id,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Autenticação falhou.'
    });
  }
};