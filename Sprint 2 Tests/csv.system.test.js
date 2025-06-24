const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('CSV Export System Tests', () => {
  let testUserId;
  let authToken;

  beforeAll(async () => {
    const userResult = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['csvtest@example.com', 'hashedpassword']
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
        ($1, 25.50, 'Food', 'Coffee shop', '2024-01-15'),
        ($1, 120.00, 'Utilities', 'Internet bill', '2024-01-16'),
        ($1, 45.75, 'Transport', 'Gas station', '2024-01-17')
    `, [testUserId]);
  });

  afterEach(async () => {
    await db.query('DELETE FROM expenses WHERE user_id = $1', [testUserId]);
  });

  test('GET /api/reports/csv returns properly formatted CSV file', async () => {
    const response = await request(app)
      .get(`/api/reports/csv?userID=${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/csv/);
    expect(response.headers['content-disposition']).toMatch(/attachment; filename="expenses-\d{4}-\d{2}-\d{2}\.csv"/);
    
    const csvContent = response.text;
    
    expect(csvContent).toContain('Date,Category,Description,Amount');
    expect(csvContent).toContain('2024-01-15,Food,Coffee shop,25.50');
    expect(csvContent).toContain('2024-01-16,Utilities,Internet bill,120.00');
    expect(csvContent).toContain('2024-01-17,Transport,Gas station,45.75');
  });

  test('CSV export with date range filtering', async () => {
    const response = await request(app)
      .get(`/api/reports/csv?userID=${testUserId}&startDate=2024-01-16&endDate=2024-01-16`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    
    const csvContent = response.text;
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    expect(lines.length).toBe(2);
    expect(csvContent).toContain('2024-01-16,Utilities,Internet bill,120.00');
    expect(csvContent).not.toContain('2024-01-15');
    expect(csvContent).not.toContain('2024-01-17');
  });

  test('CSV export returns empty file for user with no expenses', async () => {
    const emptyUserResult = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['emptycsv@example.com', 'hashedpassword']
    );
    const emptyUserId = emptyUserResult.rows[0].id;

    const response = await request(app)
      .get(`/api/reports/csv?userID=${emptyUserId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/csv/);
    
    const csvContent = response.text;
    expect(csvContent).toBe('Date,Category,Description,Amount\n');

    await db.query('DELETE FROM users WHERE id = $1', [emptyUserId]);
  });

  test('CSV export requires authentication', async () => {
    const response = await request(app)
      .get(`/api/reports/csv?userID=${testUserId}`);

    expect(response.statusCode).toBe(401);
  });

  test('CSV export with category filtering', async () => {
    const response = await request(app)
      .get(`/api/reports/csv?userID=${testUserId}&category=Food`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    
    const csvContent = response.text;
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    expect(lines.length).toBe(2);
    expect(csvContent).toContain('Food,Coffee shop');
    expect(csvContent).not.toContain('Utilities');
    expect(csvContent).not.toContain('Transport');
  });
});


