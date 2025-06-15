const request = require('supertest');
const express = require('express');
const budgetsRouter = require('../routes/budgets');
const db = require('../db');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/budgets', budgetsRouter);
  return app;
}

beforeAll(async () => {
  await db.query('DELETE FROM budgets');
  await db.query('DELETE FROM users');
  const hashed = await bcrypt.hash('pw', 10);
  await db.query('INSERT INTO users (id, username, password) VALUES ($1, $2, $3)', [1, 'zoe', hashed]);
});

afterAll(async () => {
  await db.query('DELETE FROM budgets');
  await db.query('DELETE FROM users');
});

describe('RQT-10: POST /api/budgets', () => {
  const app = createApp();

  test('201: Create a new budget', async () => {
    const payload = {
      name: 'Groceries June',
      amount: 500,
      category: 'Food',
      period_type: 'monthly',
      start_date: '2025-06-01',
      end_date: '2025-06-30'
    };
    const resp = await request(app)
      .post('/api/budgets')
      .send(payload)
      .expect(201);

    expect(resp.body).toHaveProperty('id');
    expect(Number(resp.body.amount)).toBe(500);
  });

  test('400: Missing required fields', async () => {
    const resp = await request(app)
      .post('/api/budgets')
      .send({})
      .expect(400);

    expect(resp.body.error).toMatch(/Missing required fields/i);
  });
});
