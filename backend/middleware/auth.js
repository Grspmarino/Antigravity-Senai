const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kuromi_secret_key_12345';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
