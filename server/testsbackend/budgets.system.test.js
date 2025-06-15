const request = require('supertest');
const app = require('../app');

describe('RQT-10 System: basic budget CRUD with auth', () => {
  let token;
  let budgetId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: 'testuser', password: 'testpassword' });
    token = res.body.token;
  });

  test('create → retrieve → update → delete a budget', async () => {
    const newBudget = { amount: 1000, category: 'food', month: '2025-06' };

    const createRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send(newBudget);

    expect(createRes.statusCode).toBe(201);
    budgetId = createRes.body.id;

    const getRes = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.statusCode).toBe(200);

    const updatedBudget = { amount: 1200, category: 'food', month: '2025-06' };
    const updateRes = await request(app)
      .put(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBudget);

    expect(updateRes.statusCode).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(204);
  });
});
