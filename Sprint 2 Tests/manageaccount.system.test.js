const request = require('supertest');
const app = require('../app');
const db = require('../db');
const bcrypt = require('bcrypt');

describe('User Management System Tests', () => {
  let testUserId;
  let authToken;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const userResult = await db.query(
      'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id',
      ['usertest@example.com', hashedPassword, 'testuser']
    );
    testUserId = userResult.rows[0].id;
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  test('PUT /api/users/:id updates username successfully', async () => {
    const response = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ username: 'updateduser' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toMatch(/updated/i);
    expect(response.body.user.username).toBe('updateduser');

    const dbResult = await db.query('SELECT username FROM users WHERE id = $1', [testUserId]);
    expect(dbResult.rows[0].username).toBe('updateduser');
  });

  test('PUT /api/users/:id changes password and returns success', async () => {
    const newPassword = 'NewP@ssw0rd123';
    const response = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ password: newPassword });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toMatch(/updated/i);

    const dbResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [testUserId]);
    const isValidPassword = await bcrypt.compare(newPassword, dbResult.rows[0].password_hash);
    expect(isValidPassword).toBe(true);
  });

  test('PUT /api/users/:id rejects weak passwords', async () => {
    const response = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ password: '123' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toMatch(/password/i);
  });

  test('GET /api/users/:id returns user profile without sensitive data', async () => {
    const response = await request(app)
      .get(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email');
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).not.toHaveProperty('password_hash');
  });

  test('PUT /api/users/:id rejects duplicate username', async () => {
    const anotherUser = await db.query(
      'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id',
      ['another@example.com', 'hashedpwd', 'anotheruser']
    );

    const response = await request(app)
      .put(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ username: 'anotheruser' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toMatch(/username.*exists/i);

    await db.query('DELETE FROM users WHERE id = $1', [anotherUser.rows[0].id]);
  });

  test('authentication required for user updates', async () => {
    const response = await request(app)
      .put(`/api/users/${testUserId}`)
      .send({ username: 'hacker' });

    expect(response.statusCode).toBe(401);
  });
});
