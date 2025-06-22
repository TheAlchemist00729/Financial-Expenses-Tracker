const request = require('supertest');
const app = require('../app');
const db = require('../db');

beforeEach(async () => {
  await db.query('DELETE FROM users');
});

afterAll(async () => {});

describe('RQT-13: POST /api/users/signup', () => {
  test('201: Successfully creates a new user and returns JWT + user data', async () => {
    const payload = { username: 'alice', password: 'secret123' };
    const resp = await request(app)
      .post('/api/users/signup')
      .send(payload)
      .expect(201);

    expect(resp.body.user).toHaveProperty('id');
    expect(resp.body.user.username).toBe('alice');
    expect(resp.body.token).toBeDefined();
  });

  test('409: Duplicate username returns "Username already exists"', async () => {
    const payload = { username: 'charlie', password: 'mypassword' };

    await request(app)
      .post('/api/users/signup')
      .send(payload)
      .expect(201);

    const resp = await request(app)
      .post('/api/users/signup')
      .send(payload)
      .expect(409);

    expect(resp.body.error).toBe('Username already exists');
  });

  test('500: If DB insertion fails, returns "Internal server error"', async () => {
    jest.spyOn(db, 'query').mockImplementation(() => {
      throw new Error('DB down');
    });

    const payload = { username: 'david', password: 'whatever' };

    const resp = await request(app)
      .post('/api/users/signup')
      .send(payload)
      .expect(500);

    expect(resp.body.error).toBe('Internal server error');

    db.query.mockRestore();
  });
});
