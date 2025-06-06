const request = require('supertest');
const app = require('../server');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

describe('RQT-10 System: end-to-end budget flow', () => {
  let token, budgetId;

  beforeAll(async () => {
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM budgets');

    const hashed = await bcrypt.hash('pw', 10);
    const result = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      ['wendy', hashed]
    );
    const userId = result.rows[0].id;
    token = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await db.query('DELETE FROM users');
    await db.query('DELETE FROM budgets');
    await db.end();
  });

  test('create → retrieve → update → delete a budget', async () => {
    const createResp = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000, category: 'Rent', month: '2025-06' })
      .expect(200);
    budgetId = createResp.body.budget.id;

    const getResp = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(getResp.body.budgets).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: budgetId })])
    );

    const updateResp = await request(app)
      .put(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1200 })
      .expect(200);
    expect(updateResp.body.budget.amount).toBe('1200');

    const deleteResp = await request(app)
      .delete(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(deleteResp.body.success).toBe(true);
  });
});


