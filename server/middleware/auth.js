const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, './.env'),
});

module.exports = function ensureAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Malformed authorization header' });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload.user;
    return next();
  } catch (err) {
    console.error('[Auth] JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Token is not valid or has expired' });
  }
};

