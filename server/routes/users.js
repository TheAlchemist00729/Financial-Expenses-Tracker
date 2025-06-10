const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const logFilePath = path.resolve(__dirname, '../signup-log.txt');
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

async function logToFile(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  try {
    await fs.appendFile(logFilePath, entry, 'utf8');
  } catch (writeErr) {
    console.error('[LOG FILE ERROR]', writeErr);
  }
}

function validateAuthFields(req, res, next) {
  const { username, password } = req.body;
  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  req.body.username = username.trim();
  next();
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

router.post('/signup', validateAuthFields, async (req, res) => {
  const { username, password } = req.body;
  console.log('[SIGNUP] Request:', username);
  await logToFile(`Signup requested for user: ${username}`);

  try {
    const { rowCount: existingCount } = await db.query(
      'SELECT 1 FROM users WHERE username = $1',
      [username]
    );
    if (existingCount > 0) {
      await logToFile(`Signup failed: username exists - ${username}`);
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    const user = rows[0];

    const token = generateToken({ id: user.id, username: user.username });

    await logToFile(`Signup success for user: ${username} (id: ${user.id})`);
    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('[SIGNUP] Error:', err);
    await logToFile(`Signup error for ${username}: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', validateAuthFields, async (req, res) => {
  const { username, password } = req.body;
  console.log('[LOGIN] Request:', username);
  await logToFile(`Login requested for user: ${username}`);

  try {
    const { rows } = await db.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username]
    );
    const user = rows[0];
    if (!user) {
      await logToFile(`Login failed: user not found - ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await logToFile(`Login failed: password mismatch - ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, username: user.username });

    await logToFile(`Login success for user: ${username} (id: ${user.id})`);
    return res.json({ user: { id: user.id, username: user.username }, token });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    await logToFile(`Login error for ${username}: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


