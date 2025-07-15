const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

const mockDataService = {
  getVisualizationData: jest.fn(),
  getBudgetPerformance: jest.fn(),
  getBudgetAlerts: jest.fn(),
  getCriticalInsights: jest.fn(),
  getUserData: jest.fn(),
};

const visualizationController = {
  getVisualizationData: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await mockDataService.getVisualizationData(userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch visualization data' });
    }
  },
  
  getBudgetPerformance: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await mockDataService.getBudgetPerformance(userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch budget performance data' });
    }
  },
  
  exportData: async (req, res) => {
    try {
      const userId = req.user.id;
      const { format = 'json', dateRange } = req.query;
      
      if (!['json', 'csv', 'xlsx'].includes(format)) {
        return res.status(400).json({ error: 'Invalid export format' });
      }
      
      const [visualizationData, budgetPerformance, budgetAlerts, criticalInsights] = await Promise.all([
        mockDataService.getVisualizationData(userId),
        mockDataService.getBudgetPerformance(userId),
        mockDataService.getBudgetAlerts(userId),
        mockDataService.getCriticalInsights(userId)
      ]);
      
      const exportData = {
        visualizationData,
        budgetPerformance,
        budgetAlerts,
        criticalInsights,
        exportDate: new Date().toISOString(),
        userId,
        format,
        dateRange
      };
      
      switch (format) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="budget-insights-${new Date().toISOString().split('T')[0]}.json"`);
          break;
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="budget-insights-${new Date().toISOString().split('T')[0]}.csv"`);
          break;
        case 'xlsx':
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="budget-insights-${new Date().toISOString().split('T')[0]}.xlsx"`);
          break;
      }
      
      res.json(exportData);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  }
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get('/visualization/data', authMiddleware, visualizationController.getVisualizationData);
  app.get('/visualization/budget-performance', authMiddleware, visualizationController.getBudgetPerformance);
  app.get('/visualization/export', authMiddleware, visualizationController.exportData);
  
  return app;
};

describe('Export Data Backend Test Suite', () => {
  let app;
  let validToken;
  let testUserId;

  beforeEach(() => {
    app = createApp();
    testUserId = 'test-user-123';
    validToken = jwt.sign(
      { id: testUserId, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /visualization/data', () => {
    it('should return visualization data for authenticated user', async () => {
      const mockVisualizationData = {
        budgetData: [
          { category: 'Food', budget: 500, spent: 300 },
          { category: 'Transport', budget: 200, spent: 150 }
        ],
        expenseTrends: [
          { date: '2024-01-01', total_amount: 450 },
          { date: '2024-01-02', total_amount: 300 }
        ],
        categoryBreakdown: [
          { category: 'Food', total_amount: 300 },
          { category: 'Transport', total_amount: 150 }
        ],
        budgetUtilization: [
          { category: 'Food', budget_amount: 500, spent_amount: 300, utilization_percentage: 60 },
          { category: 'Transport', budget_amount: 200, spent_amount: 150, utilization_percentage: 75 }
        ]
      };

      mockDataService.getVisualizationData.mockResolvedValue(mockVisualizationData);

      const response = await request(app)
        .get('/visualization/data')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual(mockVisualizationData);
      expect(mockDataService.getVisualizationData).toHaveBeenCalledWith(testUserId);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/visualization/data')
        .expect(401);

      expect(response.body).toEqual({ error: 'No token provided' });
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/visualization/data')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({ error: 'Invalid token' });
    });

    it('should handle database errors gracefully', async () => {
      mockDataService.getVisualizationData.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/visualization/data')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch visualization data' });
    });
  });

  describe('GET /visualization/budget-performance', () => {
    it('should return budget performance data for authenticated user', async () => {
      const mockBudgetPerformance = {
        totalBudget: 1000,
        totalSpent: 650,
        totalRemaining: 350,
        averageUtilization: 65,
        overall_health: 'Good',
        categories_over_budget: 0,
        avg_utilization: 65
      };

      mockDataService.getBudgetPerformance.mockResolvedValue(mockBudgetPerformance);

      const response = await request(app)
        .get('/visualization/budget-performance')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual(mockBudgetPerformance);
      expect(mockDataService.getBudgetPerformance).toHaveBeenCalledWith(testUserId);
    });

    it('should handle service errors', async () => {
      mockDataService.getBudgetPerformance.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/visualization/budget-performance')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch budget performance data' });
    });
  });

  describe('GET /visualization/export', () => {
    const mockExportData = {
      visualizationData: {
        budgetData: [{ category: 'Food', budget: 500, spent: 300 }],
        expenseTrends: [{ date: '2024-01-01', total_amount: 450 }]
      },
      budgetPerformance: {
        totalBudget: 1000,
        totalSpent: 650,
        totalRemaining: 350
      },
      budgetAlerts: [
        {
          id: 'alert-1',
          severity: 'medium',
          category: 'Food',
          message: 'Budget warning'
        }
      ],
      criticalInsights: [
        {
          id: 'insight-1',
          title: 'Spending Increase',
          message: 'Your spending has increased by 15%'
        }
      ]
    };

    beforeEach(() => {
      mockDataService.getVisualizationData.mockResolvedValue(mockExportData.visualizationData);
      mockDataService.getBudgetPerformance.mockResolvedValue(mockExportData.budgetPerformance);
      mockDataService.getBudgetAlerts.mockResolvedValue(mockExportData.budgetAlerts);
      mockDataService.getCriticalInsights.mockResolvedValue(mockExportData.criticalInsights);
    });

    it('should export data in JSON format by default', async () => {
      const response = await request(app)
        .get('/visualization/export')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.json');
      
      expect(response.body).toMatchObject({
        visualizationData: mockExportData.visualizationData,
        budgetPerformance: mockExportData.budgetPerformance,
        budgetAlerts: mockExportData.budgetAlerts,
        criticalInsights: mockExportData.criticalInsights,
        userId: testUserId,
        format: 'json'
      });
      
      expect(response.body.exportDate).toBeDefined();
    });

    it('should export data in CSV format when requested', async () => {
      const response = await request(app)
        .get('/visualization/export?format=csv')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body.format).toBe('csv');
    });

    it('should export data in XLSX format when requested', async () => {
      const response = await request(app)
        .get('/visualization/export?format=xlsx')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      expect(response.body.format).toBe('xlsx');
    });

    it('should return 400 for invalid export format', async () => {
      const response = await request(app)
        .get('/visualization/export?format=invalid')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid export format' });
    });

    it('should handle date range parameter', async () => {
      const dateRange = '2024-01-01,2024-01-31';
      
      const response = await request(app)
        .get(`/visualization/export?dateRange=${dateRange}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.dateRange).toBe(dateRange);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/visualization/export')
        .expect(401);

      expect(response.body).toEqual({ error: 'No token provided' });
    });

    it('should handle service errors during export', async () => {
      mockDataService.getVisualizationData.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/visualization/export')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to export data' });
    });

    it('should call all required services for export', async () => {
      await request(app)
        .get('/visualization/export')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(mockDataService.getVisualizationData).toHaveBeenCalledWith(testUserId);
      expect(mockDataService.getBudgetPerformance).toHaveBeenCalledWith(testUserId);
      expect(mockDataService.getBudgetAlerts).toHaveBeenCalledWith(testUserId);
      expect(mockDataService.getCriticalInsights).toHaveBeenCalledWith(testUserId);
    });

    it('should handle partial service failures gracefully', async () => {
      mockDataService.getVisualizationData.mockResolvedValue(mockExportData.visualizationData);
      mockDataService.getBudgetPerformance.mockResolvedValue(mockExportData.budgetPerformance);
      mockDataService.getBudgetAlerts.mockRejectedValue(new Error('Alerts service down'));
      mockDataService.getCriticalInsights.mockResolvedValue(mockExportData.criticalInsights);

      const response = await request(app)
        .get('/visualization/export')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to export data' });
    });

    it('should set correct filename with current date', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get('/visualization/export')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain(`budget-insights-${today}.json`);
    });
  });

  describe('Export Data Integration Tests', () => {
    it('should maintain data consistency across all endpoints', async () => {
      const testData = {
        visualizationData: {
          budgetUtilization: [
            { category: 'Food', budget_amount: 500, spent_amount: 400, utilization_percentage: 80 }
          ]
        },
        budgetPerformance: {
          totalBudget: 1000,
          totalSpent: 700,
          averageUtilization: 70
        }
      };

      mockDataService.getVisualizationData.mockResolvedValue(testData.visualizationData);
      mockDataService.getBudgetPerformance.mockResolvedValue(testData.budgetPerformance);
      mockDataService.getBudgetAlerts.mockResolvedValue([]);
      mockDataService.getCriticalInsights.mockResolvedValue([]);

      const visualResponse = await request(app)
        .get('/visualization/data')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const performanceResponse = await request(app)
        .get('/visualization/budget-performance')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const exportResponse = await request(app)
        .get('/visualization/export')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(exportResponse.body.visualizationData).toEqual(visualResponse.body);
      expect(exportResponse.body.budgetPerformance).toEqual(performanceResponse.body);
    });

    it('should handle concurrent export requests', async () => {
      mockDataService.getVisualizationData.mockResolvedValue({ budgetData: [] });
      mockDataService.getBudgetPerformance.mockResolvedValue({ totalBudget: 1000 });
      mockDataService.getBudgetAlerts.mockResolvedValue([]);
      mockDataService.getCriticalInsights.mockResolvedValue([]);

      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .get('/visualization/export')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.userId).toBe(testUserId);
      });
    });
  });
});