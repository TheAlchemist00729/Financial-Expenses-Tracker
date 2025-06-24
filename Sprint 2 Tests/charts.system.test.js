const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Charts System Tests', () => {
  let testUserId;
  let authToken;

  beforeAll(async () => {
    const userResult = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['charttest@example.com', 'hashedpassword']
    );
    testUserId = userResult.rows[0].id;
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await db.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
    await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  beforeEach(async () => {
    await db.query(`
      INSERT INTO expenses (user_id, amount, category, description, date)
      VALUES 
        ($1, 150.50, 'Food', 'Groceries', CURRENT_DATE),
        ($1, 800.00, 'Rent', 'Monthly rent', CURRENT_DATE),
        ($1, 75.25, 'Entertainment', 'Movie tickets', CURRENT_DATE),
        ($1, 120.00, 'Utilities', 'Electric bill', CURRENT_DATE)
    `, [testUserId]);
  });

  afterEach(async () => {
    await db.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
  });

  test('GET /api/summary returns data suitable for chart visualizations', async () => {
    const response = await request(app)
      .get(`/api/summary?userID=${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('summary');
    expect(Array.isArray(response.body.summary)).toBe(true);

    const summary = response.body.summary;
    expect(summary.length).toBeGreaterThan(0);

    summary.forEach(item => {
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('amount');
      expect(typeof item.amount).toBe('number');
    });
  });

  test('GET /api/expenses/monthly returns time-series data for line charts', async () => {
    const response = await request(app)
      .get(`/api/expenses/monthly?userID=${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('monthlyTotals');
    expect(Array.isArray(response.body.monthlyTotals)).toBe(true);

    if (response.body.monthlyTotals.length > 0) {
      response.body.monthlyTotals.forEach(item => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('total');
        expect(typeof item.total).toBe('number');
      });
    }
  });

  test('chart data endpoint handles user with no expenses', async () => {
    const emptyUserResult = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['empty@example.com', 'hashedpassword']
    );
    const emptyUserId = emptyUserResult.rows[0].id;

    const response = await request(app)
      .get(`/api/summary?userID=${emptyUserId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.summary).toEqual([]);

    await db.query('DELETE FROM users WHERE id = $1', [emptyUserId]);
  });
});
