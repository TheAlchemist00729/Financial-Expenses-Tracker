const request = require('supertest');
const app = require('../server');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

describe('RQT-04 System: full GET /api/expenses and /api/summary', () => {
  let token;

  beforeAll(async () => {
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM expenses');

    const hashed = await bcrypt.hash('pw', 10);
    const result = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      ['liam', hashed]
    );
    const userId = result.rows[0].id;
    token = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const expenses = [
      { amount: 5, description: 'Tea', date: '2025-06-04', category: 'Beverage' },
      { amount: 20, description: 'Dinner', date: '2025-06-04', category: 'Food' },
      { amount: 7, description: 'Snack', date: '2025-06-04', category: 'Food' },
    ];
    for (let e of expenses) {
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(e)
        .expect(200);
    }
  });

  afterAll(async () => {
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM expenses');
    await db.end();
  });

  test('GET /api/expenses returns the three inserted items', async () => {
    const resp = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resp.body.expenses.length).toBe(3);
    expect(resp.body.expenses[0]).toHaveProperty('description');
  });

  test('GET /api/summary returns correct totals', async () => {
    const resp = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resp.body.summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'Beverage', total: '5.00' }),
        expect.objectContaining({ category: 'Food', total: '27.00' }),
      ])
    );
  });
});



