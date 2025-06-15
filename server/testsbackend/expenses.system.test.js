const request = require('supertest');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

jest.setTimeout(20000);

const agent = request.agent('http://localhost:5000');

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
    token = jwt.sign({ id: userId, username: 'frank' }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  });

  afterAll(async () => {
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM expenses');
    // await db.end(); // removed because it's undefined
  });

  test('POST /api/expenses with valid token should create expense', async () => {
    const payload = {
      amount: 42.0,
      description: 'Books',
      date: '2025-06-04',
      category: 'Education',
    };

    const resp = await agent
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    expect(resp.body.expense).toMatchObject({
      description: 'Books',
      category: 'Education',
    });
  });
});
