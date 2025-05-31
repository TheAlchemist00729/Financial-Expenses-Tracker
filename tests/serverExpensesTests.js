//This tests importing information and the setup
const request = require('supertest');
const app = require('../server');
const db = require('../db');

beforeAll(async () => {

    });

afterAll(async () => {
    await db.query('DELETE FROM expenses');
  await db.query('DELETE FROM users');
  await db.pool.end();
});



//This tests creating a user and the auth tokens
describe('Expenses API', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/users/signup')
      .send({ username: 'testuser', password: 'Password123' });
    token = res.body.token;
  });


//This tests POST API requests of expenses
test('POST  /api/expenses  creates an expense', async () => {
    const expenseData = { amount: 50, description: 'Lunch', date: '2025-05-29', category: 'Food' };
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send(expenseData);

    expect(res.statusCode).toBe(200);
    expect(res.body.expense).toHaveProperty('id');
    expect(res.body.expense.amount).toBe(expenseData.amount);
  });

//This tests the GET of expenses
test('GET   /api/expenses  lists expenses', async () => {
    const res = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.expenses)).toBe(true);
    expect(res.body.expenses.length).toBeGreaterThan(0);
  });


//This tests the GET summary of expenses
  test('GET   /api/expenses/summary  returns summary', async () => {
    const res = await request(app)
      .get('/api/expenses/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.summary)).toBe(true);
    expect(res.body.summary[0]).toHaveProperty('category');
    expect(res.body.summary[0]).toHaveProperty('total');
  });

//This tests the DELETE expenses

  test('DELETE /api/expenses/:id  deletes an expense', async () => {
    const add = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 20, description: 'Snack', date: '2025-05-29', category: 'Food' });
    const id = add.body.expense.id;

    const res = await request(app)
      .delete(`/api/expenses/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.deletedId).toBe(String(id));
  });
});

