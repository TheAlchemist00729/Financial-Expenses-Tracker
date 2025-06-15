const request = require('supertest');
const express = require('express');
const expensesRouter = require('../routes/expenses');
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
  app.use('/api/expenses', expensesRouter);
  return app;
}

let garyId;
let harryId;

beforeAll(async () => {
  await db.query('DELETE FROM expenses');
  await db.query('DELETE FROM users');

  const hashed1 = await bcrypt.hash('pw', 10);
  const resGary = await db.query(
    'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
    ['gary', hashed1]
  );
  garyId = resGary.rows[0].id;

  const hashed2 = await bcrypt.hash('pw2', 10);
  const resHarry = await db.query(
    'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
    ['harry', hashed2]
  );
  harryId = resHarry.rows[0].id;

  await db.query(
    'INSERT INTO expenses (user_id, amount, description, date, category) VALUES ($1,$2,$3,$4,$5)',
    [garyId, 10, 'Test', '2025-06-04', 'Misc']
  );
  await db.query(
    'INSERT INTO expenses (user_id, amount, description, date, category) VALUES ($1,$2,$3,$4,$5)',
    [harryId, 20, 'Other', '2025-06-04', 'Misc']
  );
});

afterAll(async () => {
  await db.query('DELETE FROM expenses');
  await db.query('DELETE FROM users');
});

describe('RQT-02: DELETE /api/expenses/:id', () => {
  const app = createApp();

  test('200: User can delete their own expense', async () => {
    const { rows } = await db.query('SELECT id FROM expenses WHERE user_id = $1', [garyId]);
    const expenseId = rows[0].id;

    const resp = await request(app)
      .delete(`/api/expenses/${expenseId}`)
      .expect(200);

    expect(resp.body.success).toBe(true);
  });

  test('404 or 400: Cannot delete someone else’s expense', async () => {
    const { rows } = await db.query('SELECT id FROM expenses WHERE user_id = $1', [harryId]);
    const otherId = rows[0].id;

    const resp = await request(app)
      .delete(`/api/expenses/${otherId}`)
      .expect(404);

    expect(resp.body.error).toMatch(/not found|unauthorized/i);
  });

  test('500: DB error during deletion', async () => {
    jest.spyOn(db, 'query').mockImplementationOnce(() => {
      throw new Error('DB down');
    });

    const resp = await request(app)
      .delete('/api/expenses/1')
      .expect(500);

    expect(resp.body.error).toMatch(/failed/i);

    db.query.mockRestore();
  });
});
