const request = require('supertest');
const app = require('../server');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

describe('RQT-01 System: create expense after login', () => {
  let token;

  beforeAll(async () => {
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM expenses');

    const hashed = await bcrypt.hash('abc123', 10);
    const result = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      ['frank', hashed]
    );
    const userId = result.rows[0].id;
    token = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM expenses');
    await db.end();
  });

  test('POST /api/expenses with valid token should create expense', async () => {
    const payload = {
      amount: 42.0,
      description: 'Books',
      date: '2025-06-04',
      category: 'Education',
    };

    const resp = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(resp.body.expense).toMatchObject({
      description: 'Books',
      category: 'Education',
    });
  });
});


