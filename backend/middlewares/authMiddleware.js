const jwt = require('jsonwebtoken');
require('dotenv').config();

// Bloqueia a requisição se não houver um token JWT válido no header Authorization.
// Se o token for válido, guarda o id do usuário em req.usuarioId e segue para a rota.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login novamente.' });
  }

  // Formato esperado: "Bearer <token>"
  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ erro: 'Token mal formatado.' });
  }

  const token = partes[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
    }

    // Guarda o id do usuário na requisição, para usar nos controllers
    req.usuarioId = decoded.id;
    next();
  });
}

module.exports = authMiddleware;