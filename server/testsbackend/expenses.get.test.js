const request = require('supertest');
const express = require('express');
const expensesRouter = require('../routes/expenses');
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
  app.use('/api/expenses', expensesRouter);
  return app;
}

beforeAll(async () => {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM expenses');
  const hashed = await bcrypt.hash('pw', 10);
  await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['kate', hashed]);
  await db.query(
    `INSERT INTO expenses (user_id, amount, description, date, category) VALUES
    ($1, 10, 'Coffee', '2025-06-04', 'Beverage'),
    ($1, 20, 'Lunch', '2025-06-04', 'Food'),
    ($1, 15, 'Snack', '2025-06-04', 'Food')`,
    [1]
  );
});
afterAll(async () => {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM expenses');
  await db.end();
});

describe('RQT-04: GET /api/expenses', () => {
  const app = createApp();

  test('200: Returns an array of expense objects for that user', async () => {
    const resp = await request(app).get('/api/expenses').expect(200);
    expect(Array.isArray(resp.body.expenses)).toBe(true);
    expect(resp.body.expenses.length).toBe(3);
    expect(resp.body.expenses[0]).toHaveProperty('description');
  });
});

describe('RQT-04: GET /api/summary', () => {
  const app = createApp();

  test('200: Returns aggregated summary per category', async () => {
    const resp = await request(app).get('/api/summary').expect(200);
    expect(resp.body.summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'Beverage', total: '10.00' }),
        expect.objectContaining({ category: 'Food', total: '35.00' }),
      ])
    );
  });
});


