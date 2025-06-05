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
      { id: user.id },
      process.env.JWT_SECRET || 'NO_SECRET_SET',
      { expiresIn: '1h' }
    );

    logToFile(`→ Signup successful for "${username}" (user ID: ${user.id})`);
    return res.json({ user, token });
  } catch (err) {
    logToFile(`→ ERROR during signup for "${username}": ${err.message}`);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

module.exports = router;


