const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../signup-log.txt');

function logToFile(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
  } catch (writeErr) {
    console.error('Failed to write to log file:', writeErr);
  }
}

logToFile('users.js module loaded');

router.post('/signup', async (req, res) => {
  console.log('[DEBUG] Signup request received:', req.body);
  logToFile(`Signup route hit (req.body = ${JSON.stringify(req.body)})`);

  const { username, password } = req.body;
  if (!username || !password) {
    logToFile('→ Missing username or password');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    logToFile(`→ Checking if "${username}" already exists...`);
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      logToFile(`→ Username "${username}" already exists`);
      return res.status(400).json({ error: 'Username already exists' });
    }

    logToFile(`→ Hashing password for "${username}"`);
    const hashedPassword = await bcrypt.hash(password, 10);

    logToFile(`→ Inserting new user "${username}" into database`);
    const result = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'NO_SECRET_SET',
      { expiresIn: '1h' }
    );

    logToFile(`→ Signup successful for "${username}" (user ID: ${user.id})`);
    return res.json({ user, token });
    } catch (err) {
    
    console.error('[ERROR] Signup failed:', err.stack || err);

    logToFile(`→ ERROR during signup for "${username}": ${err.stack || err}`);

    return res.status(500).json({ error: 'Signup failed' });
  }

});

router.post('/login', async (req, res) => {
  logToFile(`Login route hit (req.body = ${JSON.stringify(req.body)})`);

  const { username, password } = req.body;
  if (!username || !password) {
    logToFile('→ Missing username or password');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    logToFile(`→ Retrieving user "${username}"`);
    const result = await db.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username]
    );

    if (result.rowCount === 0) {
      logToFile(`→ Username "${username}" not found`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logToFile(`→ Password mismatch for "${username}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'NO_SECRET_SET',
      { expiresIn: '1h' }
    );

    logToFile(`→ Login successful for "${username}" (user ID: ${user.id})`);
    return res.json({ user: { id: user.id, username: user.username }, token });
  } catch (err) {
    logToFile(`→ ERROR during login for "${username}": ${err.message}`);
    return res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;

