const request = require('supertest');
const express = require('express');
const expensesRouter = require('../routes/expenses');
const db = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });


const path = require('path');
console.log('Testing mock path:', path.resolve(__dirname, '../middleware/auth'));

jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 1 };
  return next();
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
  await db.query(
    'INSERT INTO users (username, password) VALUES ($1, $2)',
    ['dummy', await require('bcrypt').hash('dummy', 1)]
  );
});
afterAll(async () => {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM expenses');
  await db.end();
});

describe('RQT-01: POST /api/expenses', () => {
  const app = createApp();

  test('200: Insert a valid expense', async () => {
    const payload = {
      amount: 25.5,
      description: 'Lunch',
      date: '2025-06-04',
      category: 'Food',
    };

    const resp = await request(app)
      .post('/api/expenses')
      .send(payload)
      .expect(200);

    expect(resp.body.expense).toHaveProperty('id');
    expect(resp.body.expense.amount).toBe('25.50');
    expect(resp.body.expense.description).toBe('Lunch');
    expect(resp.body.expense.category).toBe('Food');
  });

  test('400: Missing fields should return error', async () => {
    const resp = await request(app)
      .post('/api/expenses')
      .send({ description: 'Dinner', date: '2025-06-04', category: 'Food' })
      .expect(400);

    expect(resp.body.error).toMatch(/Invalid data/);
  });

  test('500: DB failure returns “Insertion failed”', async () => {
    jest.spyOn(db, 'query').mockImplementationOnce(() => {
      throw new Error('DB down');
    });

    const resp = await request(app)
      .post('/api/expenses')
      .send({
        amount: 10,
        description: 'Coffee',
        date: '2025-06-04',
        category: 'Beverage',
      })
      .expect(500);

    expect(resp.body.error).toBe('Insertion failed');

    db.query.mockRestore();
  });
});
