const request = require('supertest');
const express = require('express');
const router = require('express').Router();
const controller = require('./controllers/visualizationController');
const db = require('./db'); // This will be mocked

// Mock the db.query function
jest.mock('./db', () => ({
  query: jest.fn(),
}));

// Middleware to fake auth
const mockUser = { id: 1 };
const mockAuth = (req, res, next) => {
  req.user = mockUser;
  next();
};

// Setup express app with middleware and routes
const app = express();
app.use(express.json());
app.use(mockAuth);
router.get('/data', controller.getVisualizationData);
router.get('/performance', controller.getBudgetPerformance);
app.use('/api/visualization', router);

describe('Visualization Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/visualization/data', () => {
    it('should return visualization data', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ category: 'Food', budget_amount: 500, spent_amount: 450, remaining_amount: 50 }] }) // budgetData
        .mockResolvedValueOnce({ rows: [{ period: '2025-06', total_amount: 900 }] }) // expenseTrends
        .mockResolvedValueOnce({ rows: [{ date: '2025-06-23', daily_total: 30 }] }) // dailySpending
        .mockResolvedValueOnce({ rows: [{ category: 'Food', total_amount: 450 }] }) // categoryBreakdown
        .mockResolvedValueOnce({ rows: [{ category: 'Food', utilization_percentage: 90 }] }); // budgetUtilization

      const res = await request(app).get('/api/visualization/data');

      expect(res.statusCode).toBe(200);
      expect(res.body.budgetData).toHaveLength(1);
      expect(res.body.expenseTrends[0].period).toBe('2025-06');
    });

    it('should return 500 on DB error', async () => {
      db.query.mockRejectedValueOnce(new Error('Database failure'));

      const res = await request(app).get('/api/visualization/data');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toMatch(/Failed to fetch/);
    });
  });

  describe('GET /api/visualization/performance', () => {
    it('should return performance metrics', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            total_budgets: 5,
            categories_over_budget: 1,
            avg_utilization: 87.5,
            overall_health: 'Warning',
          },
        ],
      });

      const res = await request(app).get('/api/visualization/performance');

      expect(res.statusCode).toBe(200);
      expect(res.body.total_budgets).toBe(5);
      expect(res.body.overall_health).toBe('Warning');
    });

    it('should return default values if no rows', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/visualization/performance');

      expect(res.statusCode).toBe(200);
      expect(res.body.total_budgets).toBe(0);
    });

    it('should return 500 on DB error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB exploded'));

      const res = await request(app).get('/api/visualization/performance');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toMatch(/Failed to fetch/);
    });
  });
});
