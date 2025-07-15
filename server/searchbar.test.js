const request = require('supertest');
const app = require('../app');
const { sequelize, User, Expense } = require('../models');

describe('Search Functionality - Backend Tests', () => {
  let authToken;
  let userId;
  let testExpenses;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    userId = userResponse.body.user.id;
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
    
    testExpenses = [
      {
        description: 'Grocery shopping at Walmart',
        amount: 125.50,
        category: 'Food',
        date: '2024-01-15'
      },
      {
        description: 'Gas station fill-up',
        amount: 45.75,
        category: 'Transportation',
        date: '2024-01-16'
      },
      {
        description: 'Monthly Netflix subscription',
        amount: 15.99,
        category: 'Entertainment',
        date: '2024-01-17'
      },
      {
        description: 'Coffee at Starbucks',
        amount: 5.25,
        category: 'Food',
        date: '2024-01-18'
      },
      {
        description: 'Uber ride to airport',
        amount: 32.50,
        category: 'Transportation',
        date: '2024-01-19'
      },
      {
        description: 'Amazon Prime membership',
        amount: 12.99,
        category: 'Entertainment',
        date: '2024-01-20'
      },
      {
        description: 'Medical prescription',
        amount: 25.00,
        category: 'Healthcare',
        date: '2024-01-21'
      },
      {
        description: 'Lunch at McDonald\'s',
        amount: 8.50,
        category: 'Food',
        date: '2024-01-22'
      }
    ];
    
    for (const expense of testExpenses) {
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...expense,
          userId: userId
        });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/expenses - Search by Description', () => {
    test('should return expenses matching exact description', async () => {
      const response = await request(app)
        .get('/api/expenses?search=Coffee at Starbucks')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].description).toBe('Coffee at Starbucks');
    });

    test('should return expenses matching partial description (case insensitive)', async () => {
      const response = await request(app)
        .get('/api/expenses?search=coffee')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].description.toLowerCase()).toContain('coffee');
    });

    test('should return multiple expenses matching description pattern', async () => {
      const response = await request(app)
        .get('/api/expenses?search=at')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses.length).toBeGreaterThan(1);
      
      const descriptions = response.body.expenses.map(e => e.description);
      expect(descriptions.some(desc => desc.includes('at Walmart'))).toBe(true);
      expect(descriptions.some(desc => desc.includes('at Starbucks'))).toBe(true);
    });

    test('should handle special characters in search', async () => {
      const response = await request(app)
        .get('/api/expenses?search=McDonald\'s')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].description).toContain('McDonald\'s');
    });

    test('should return empty array for non-matching description', async () => {
      const response = await request(app)
        .get('/api/expenses?search=nonexistent')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(0);
    });
  });

  describe('GET /api/expenses - Search by Category', () => {
    test('should return expenses matching exact category', async () => {
      const response = await request(app)
        .get('/api/expenses?search=Food')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(3);
      response.body.expenses.forEach(expense => {
        expect(expense.category).toBe('Food');
      });
    });

    test('should return expenses matching partial category (case insensitive)', async () => {
      const response = await request(app)
        .get('/api/expenses?search=transport')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(2);
      response.body.expenses.forEach(expense => {
        expect(expense.category.toLowerCase()).toContain('transport');
      });
    });

    test('should return expenses matching entertainment category', async () => {
      const response = await request(app)
        .get('/api/expenses?search=Entertainment')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(2);
      response.body.expenses.forEach(expense => {
        expect(expense.category).toBe('Entertainment');
      });
    });
  });

  describe('GET /api/expenses - Combined Search (Description + Category)', () => {
    test('should return expenses matching either description or category', async () => {
      const response = await request(app)
        .get('/api/expenses?search=uber')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].description.toLowerCase()).toContain('uber');
    });

    test('should return expenses when search term matches category but not description', async () => {
      const response = await request(app)
        .get('/api/expenses?search=healthcare')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].category).toBe('Healthcare');
    });

    test('should return expenses when search term matches description but not category', async () => {
      const response = await request(app)
        .get('/api/expenses?search=prescription')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].description.toLowerCase()).toContain('prescription');
    });
  });

  describe('GET /api/expenses - Search Edge Cases', () => {
    test('should handle empty search term', async () => {
      const response = await request(app)
        .get('/api/expenses?search=')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(8); // Should return all expenses
    });

    test('should handle whitespace-only search term', async () => {
      const response = await request(app)
        .get('/api/expenses?search=   ')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(8); // Should return all expenses
    });

    test('should handle very long search term', async () => {
      const longSearchTerm = 'a'.repeat(1000);
      const response = await request(app)
        .get(`/api/expenses?search=${longSearchTerm}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(0);
    });

    test('should handle search with special characters', async () => {
      const response = await request(app)
        .get('/api/expenses?search=@#$%')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(0);
    });

    test('should handle search with numbers', async () => {
      const response = await request(app)
        .get('/api/expenses?search=123')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(0);
    });

    test('should handle URL-encoded search terms', async () => {
      const response = await request(app)
        .get('/api/expenses?search=McDonald%27s')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0].description).toContain('McDonald\'s');
    });
  });

  describe('GET /api/expenses - Search Performance', () => {
    test('should handle search with reasonable response time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/expenses?search=food')
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent search requests', async () => {
      const searchPromises = [
        request(app)
          .get('/api/expenses?search=food')
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .get('/api/expenses?search=transport')
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .get('/api/expenses?search=entertainment')
          .set('Authorization', `Bearer ${authToken}`)
      ];

      const responses = await Promise.all(searchPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.expenses)).toBe(true);
      });
    });
  });

  describe('GET /api/expenses - Authentication & Authorization', () => {
    test('should require authentication for search', async () => {
      const response = await request(app)
        .get('/api/expenses?search=food');
      
      expect(response.status).toBe(401);
    });

    test('should only return expenses for authenticated user', async () => {
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'password123'
        });

      const login2Response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test2@example.com',
          password: 'password123'
        });

      const authToken2 = login2Response.body.token;

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          description: 'User2 Food Purchase',
          amount: 30.00,
          category: 'Food',
          date: '2024-01-23'
        });

      const response = await request(app)
        .get('/api/expenses?search=User2')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(0);
    });

    test('should handle invalid authentication token', async () => {
      const response = await request(app)
        .get('/api/expenses?search=food')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/expenses - Search Result Formatting', () => {
    test('should return expenses with correct structure', async () => {
      const response = await request(app)
        .get('/api/expenses?search=food')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses).toHaveLength(3);
      
      response.body.expenses.forEach(expense => {
        expect(expense).toHaveProperty('id');
        expect(expense).toHaveProperty('description');
        expect(expense).toHaveProperty('amount');
        expect(expense).toHaveProperty('category');
        expect(expense).toHaveProperty('date');
        expect(expense).toHaveProperty('userId');
        expect(typeof expense.amount).toBe('number');
        expect(typeof expense.description).toBe('string');
        expect(typeof expense.category).toBe('string');
      });
    });

    test('should return expenses sorted by date (newest first)', async () => {
      const response = await request(app)
        .get('/api/expenses?search=food')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.expenses.length).toBeGreaterThan(1);
      
      for (let i = 0; i < response.body.expenses.length - 1; i++) {
        const currentDate = new Date(response.body.expenses[i].date);
        const nextDate = new Date(response.body.expenses[i + 1].date);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    test('should include pagination metadata if implemented', async () => {
      const response = await request(app)
        .get('/api/expenses?search=food&page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      
      if (response.body.pagination) {
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination).toHaveProperty('pages');
      }
    });
  });
});

const searchTestHelpers = {
  // Helper to create bulk test data
  createBulkExpenses: async (authToken, count = 100) => {
    const categories = ['Food', 'Transportation', 'Entertainment', 'Healthcare', 'Utilities'];
    const descriptions = [
      'Grocery shopping', 'Gas station', 'Movie tickets', 'Doctor visit', 'Electric bill',
      'Restaurant dinner', 'Bus fare', 'Streaming service', 'Pharmacy', 'Internet bill',
      'Coffee shop', 'Taxi ride', 'Concert tickets', 'Dentist', 'Water bill'
    ];
    
    const expenses = [];
    for (let i = 0; i < count; i++) {
      const expense = {
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        amount: Math.round(Math.random() * 200 * 100) / 100,
        category: categories[Math.floor(Math.random() * categories.length)],
        date: new Date(2024, 0, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0]
      };
      expenses.push(expense);
    }
    
    return expenses;
  },

  performanceTest: async (authToken, searchTerm) => {
    const startTime = process.hrtime();
    
    const response = await request(app)
      .get(`/api/expenses?search=${searchTerm}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    const endTime = process.hrtime(startTime);
    const responseTimeMs = endTime[0] * 1000 + endTime[1] / 1000000;
    
    return {
      response,
      responseTime: responseTimeMs
    };
  }
};

module.exports = { searchTestHelpers };