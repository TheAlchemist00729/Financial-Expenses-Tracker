const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usersRouter = require('../routes/users');
const db = require('../db');                  
require('dotenv').config({ path: '../.env' });


function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', usersRouter);
  return app;
}

beforeAll(async () => {

  await db.query('DELETE FROM users');
});
afterAll(async () => {
  
  await db.query('DELETE FROM users');
  await db.end();
});

describe('RQT-13: POST /api/users/signup', () => {
  const app = createApp();

  test('200: Successfully creates a new user and returns JWT + user data', async () => {
    const payload = { username: 'alice', password: 'password123' };

    const resp = await request(app)
      .post('/api/users/signup')
      .send(payload)
      .expect(200);

    
    expect(resp.body.user).toHaveProperty('id');
    expect(resp.body.user.username).toBe('alice');
    expect(resp.body).toHaveProperty('token');

    
    const decoded = jwt.verify(resp.body.token, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('id', resp.body.user.id);
  });

  test('400: Missing username or password returns error', async () => {
   
    let resp = await request(app)
      .post('/api/users/signup')
      .send({ username: 'bob', password: '' })
      .expect(400);
    expect(resp.body.error).toMatch(/required/);


    resp = await request(app)
      .post('/api/users/signup')
      .send({ username: '', password: 'secret' })
      .expect(400);
    expect(resp.body.error).toMatch(/required/);
  });

  test('400: Duplicate username returns "Username already exists"', async () => {
    const payload = { username: 'charlie', password: 'mypassword' };
    await request(app).post('/api/users/signup').send(payload).expect(200);

    const resp = await request(app)
      .post('/api/users/signup')
      .send(payload)
      .expect(400);

    expect(resp.body.error).toBe('Username already exists');
  });

  test('500: If DB insertion fails, returns “Signup failed”', async () => {
    jest.spyOn(db, 'query').mockImplementationOnce(() => {
      throw new Error('DB down');
    });

    const resp = await request(app)
      .post('/api/users/signup')
      .send({ username: 'david', password: 'test1234' })
      .expect(500);

    expect(resp.body.error).toBe('Signup failed');

    db.query.mockRestore();
  });
});

