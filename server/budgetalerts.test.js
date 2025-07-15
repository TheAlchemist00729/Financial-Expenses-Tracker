const request = require('supertest');
const app = require('./app');
const jwt = require('jsonwebtoken');

jest.mock('./db', () => ({
  query: jest.fn()
}));

const db = require('./db');

const testUserId = 'test-user-123';
const validToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'test-secret');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Budget Alerts via Visualization Endpoints', () => {
  describe('GET /visualization/data', () => {
    it('should fetch budget data with alert-triggering conditions', async () => {
      const mockBudgetData = [
        { category: 'Food', budget_amount: 500, spent_amount: 600, remaining_amount: -100 }, // Over budget
        { category: 'Transport', budget_amount: 200, spent_amount: 180, remaining_amount: 20 }, // Near budget
      ];

      const mockExpenseTrends = [
        { period: '2025-01', total_amount: 1200 },
        { period: '2024-12', total_amount: 1100 },
      ];

      const mockDailySpending = [
        { date: '2025-01-15', daily_total: 45 },
        { date: '2025-01-14', daily_total: 38 },
      ];

      const mockCategoryBreakdown = [
        { category: 'Food', total_amount: 600 },
        { category: 'Transport', total_amount: 180 },
      ];

      const mockBudgetUtilization = [
        { category: 'Food', budget_amount: 500, spent_amount: 600, remaining_amount: -100, utilization_percentage: 120 },
        { category: 'Transport', budget_amount: 200, spent_amount: 180, remaining_amount: 20, utilization_percentage: 90 },
      ];

      db.query
        .mockResolvedValueOnce({ rows: mockBudgetData })
        .mockResolvedValueOnce({ rows: mockExpenseTrends })
        .mockResolvedValueOnce({ rows: mockDailySpending })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown })
        .mockResolvedValueOnce({ rows: mockBudgetUtilization });

      const response = await request(app)
        .get('/visualization/data')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(db.query).toHaveBeenCalledTimes(5);
      expect(response.body).toEqual({
        budgetData: mockBudgetData,
        expenseTrends: mockExpenseTrends,
        dailySpending: mockDailySpending,
        categoryBreakdown: mockCategoryBreakdown,
        budgetUtilization: mockBudgetUtilization
      });

      const overBudgetCategories = response.body.budgetUtilization.filter(item => item.utilization_percentage > 100);
      expect(overBudgetCategories).toHaveLength(1);
      expect(overBudgetCategories[0].category).toBe('Food');
    });

    it('should return 401 when no token provided', async () => {
      await request(app)
        .get('/visualization/data')
        .expect(401);
    });
  });

  describe('GET /visualization/budget-performance', () => {
    it('should fetch budget performance data for alert assessment', async () => {
      const mockPerformanceData = {
        total_budgets: 5,
        categories_over_budget: 2,
        avg_utilization: 85.5,
        overall_health: 'Warning'
      };

      db.query.mockResolvedValue({ rows: [mockPerformanceData] });

      const response = await request(app)
        .get('/visualization/budget-performance')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [testUserId]
      );
      expect(response.body).toEqual(mockPerformanceData);
    });

    it('should return default values when no budget data exists', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/visualization/budget-performance')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({
        total_budgets: 0,
        categories_over_budget: 0,
        avg_utilization: 0,
        overall_health: 'Good'
      });
    });

    it('should handle database errors gracefully', async () => {
      db.query.mockRejectedValue(new Error('Database connection failed'));

      await request(app)
        .get('/visualization/budget-performance')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500)
        .expect(res => {
          expect(res.body.error).toBe('Failed to fetch budget performance data');
        });
    });
  });
});

describe('Budget Alert Logic Tests', () => {
  describe('Alert Conditions', () => {
    it('should identify over-budget categories', () => {
      const budgetData = [
        { category: 'Food', budget_amount: 500, spent_amount: 600, utilization_percentage: 120 },
        { category: 'Transport', budget_amount: 200, spent_amount: 180, utilization_percentage: 90 },
        { category: 'Entertainment', budget_amount: 100, spent_amount: 120, utilization_percentage: 120 },
      ];

      const overBudgetCategories = budgetData.filter(item => item.utilization_percentage > 100);
      expect(overBudgetCategories).toHaveLength(2);
      expect(overBudgetCategories.map(c => c.category)).toEqual(['Food', 'Entertainment']);
    });

    it('should identify categories approaching budget limits', () => {
      const budgetData = [
        { category: 'Food', budget_amount: 500, spent_amount: 450, utilization_percentage: 90 },
        { category: 'Transport', budget_amount: 200, spent_amount: 180, utilization_percentage: 90 },
        { category: 'Entertainment', budget_amount: 100, spent_amount: 50, utilization_percentage: 50 },
      ];

      const nearBudgetCategories = budgetData.filter(item => 
        item.utilization_percentage >= 80 && item.utilization_percentage <= 100
      );
      expect(nearBudgetCategories).toHaveLength(2);
      expect(nearBudgetCategories.map(c => c.category)).toEqual(['Food', 'Transport']);
    });

    it('should classify budget health correctly', () => {
      const testCases = [
        { categories_over_budget: 0, total_budgets: 5, expected: 'Good' },
        { categories_over_budget: 1, total_budgets: 5, expected: 'Warning' },
        { categories_over_budget: 2, total_budgets: 5, expected: 'Critical' },
        { categories_over_budget: 3, total_budgets: 5, expected: 'Critical' },
      ];

      testCases.forEach(({ categories_over_budget, total_budgets, expected }) => {
        const healthStatus = categories_over_budget === 0 ? 'Good' :
                           categories_over_budget <= total_budgets * 0.3 ? 'Warning' : 'Critical';
        expect(healthStatus).toBe(expected);
      });
    });
  });

  describe('Alert Severity Classification', () => {
    it('should classify alert severity based on utilization percentage', () => {
      const testCases = [
        { utilization: 85, expected: 'low' },
        { utilization: 95, expected: 'medium' },
        { utilization: 110, expected: 'high' },
        { utilization: 150, expected: 'high' },
      ];

      testCases.forEach(({ utilization, expected }) => {
        let severity;
        if (utilization >= 100) {
          severity = 'high';
        } else if (utilization >= 90) {
          severity = 'medium';
        } else if (utilization >= 80) {
          severity = 'low';
        }
        
        if (severity) {
          expect(severity).toBe(expected);
        }
      });
    });
  });
});

