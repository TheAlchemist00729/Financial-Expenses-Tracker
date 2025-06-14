const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('RQT-13 System: full signup → login flow', () => {
  beforeAll(async () => {
    await db.query('DELETE FROM users');
  });

  afterAll(async () => {
    await db.query('DELETE FROM users');
  });

  test('POST /api/users/signup then POST /api/users/login works end-to-end', async () => {
    const signupRes = await request(app)
      .post('/api/users/signup')
      .send({ username: 'eve', password: 'Password123!' })
      .expect(201);

    expect(signupRes.body).toHaveProperty('token');
    expect(signupRes.body.user.username).toBe('eve');

    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ username: 'eve', password: 'Password123!' })
      .expect(200);

    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.user.username).toBe('eve');
  });
});
