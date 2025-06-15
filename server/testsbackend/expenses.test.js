const request = require('supertest');
const app = require('../app');
const db = require('../db');
const bcrypt = require('bcrypt');

jest.mock('../middleware/auth', () => {
  return (req, res, next) => {
    req.user = { id: 1, username: 'dummy' };
    next();
  };
});

let token;

beforeAll(async () => {
  await db.query('DELETE FROM expenses');
  await db.query('DELETE FROM users');
  const hashedPassword = await bcrypt.hash('dummy', 1);
  await db.query(
    'INSERT INTO users (id, username, password) VALUES ($1, $2, $3)',
    [1, 'dummy', hashedPassword]
  );
  
  token = 'fake-token';
});

afterAll(async () => {
  await db.query('DELETE FROM expenses');
  await db.query('DELETE FROM users');
  if (db.pool && typeof db.pool.end === 'function') {
    await db.pool.end();
  } else if (db.end && typeof db.end === 'function') {
    await db.end();
  }
});

describe('RQT-01: POST /api/expenses', () => {
  test('201: Insert a valid expense', async () => {
    const payload = {
      amount: 25.50,
      description: 'Lunch',
      date: '2025-06-14',
      category: 'Food'
    };
    const resp = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    
    console.log('Response status:', resp.status);
    console.log('Response body:', resp.body);
    
    expect(resp.status).toBe(201);
    expect(resp.body.expense).toHaveProperty('id');
    expect(resp.body.expense.amount).toBe('25.50');
  });
  
  test('400: Missing fields should return error', async () => {
    const payload = {
      description: 'Dinner',
      date: '2025-06-14',
      category: 'Food'
    };
    const resp = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400);
    expect(resp.body.error).toMatch(/required and must be valid/);
  });
  
  test('500: DB failure returns "Failed to save expense"', async () => {
    const originalQuery = db.query;
    const dbQuerySpy = jest.spyOn(db, 'query').mockImplementation((query, params) => {
      if (typeof query === 'string' && query.includes('INSERT INTO expenses')) {
        throw new Error('DB down');
      }
      return originalQuery.call(db, query, params);
    });
    
    const payload = {
      amount: 10.00,
      description: 'Coffee',
      date: '2025-06-14',
      category: 'Beverage'
    };
    const resp = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(500);
    expect(resp.body.error).toBe('Failed to save expense');
    dbQuerySpy.mockRestore();
  });
});

