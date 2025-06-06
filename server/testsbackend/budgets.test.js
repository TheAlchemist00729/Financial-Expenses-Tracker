const request = require('supertest');
const express = require('express');
const budgetsRouter = require('../routes/budgets');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM budgets');
  const hashed = await bcrypt.hash('pw', 10);
  await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['zoe', hashed]);
});
afterAll(async () => {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM budgets');
  await db.end();
});

describe('RQT-10: POST /api/budgets', () => {
  const app = createApp();

  test('200: Create a new budget', async () => {
    const payload = { amount: 500, category: 'Food', month: '2025-06' };
    const resp = await request(app)
      .post('/api/budgets')
      .send(payload)
      .expect(200);

    expect(resp.body.budget).toHaveProperty('id');
    expect(resp.body.budget.amount).toBe('500');
  });

  test('400: Missing required fields', async () => {
    const resp = await request(app).post('/api/budgets').send({}).expect(400);
    expect(resp.body.error).toMatch(/required/);
  });
});



