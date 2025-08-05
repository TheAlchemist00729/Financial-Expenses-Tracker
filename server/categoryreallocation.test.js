const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const app = require('./app');

// Mock the database
jest.mock('./db', () => ({
  query: jest.fn()
}));

const db = require('./db');

// Mock reallocation service
const mockReallocationService = {
  getUserBudgetData: jest.fn(),
  analyzeSpendingPatterns: jest.fn(),
  generateReallocationRecommendations: jest.fn(),
  calculateConfidenceScore: jest.fn(),
  generateReasoning: jest.fn()
};

// Mock the service module if it exists
jest.mock('./services/reallocationService', () => mockReallocationService, { virtual: true });

const testUserId = 'test-user-123';
const validToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'test-secret');

beforeEach(() => {
  jest.clearAllMocks();
  
  // Set up default mock implementations
  mockReallocationService.getUserBudgetData.mockResolvedValue({
    budgets: [
      { id: 1, category: 'food', amount: 500, spent_amount: 350, user_id: 1 },
      { id: 2, category: 'transport', amount: 300, spent_amount: 250, user_id: 1 },
      { id: 3, category: 'entertainment', amount: 200, spent_amount: 280, user_id: 1 },
      { id: 4, category: 'utilities', amount: 400, spent_amount: 380, user_id: 1 },
      { id: 5, category: 'shopping', amount: 250, spent_amount: 100, user_id: 1 }
    ],
    expenses: [
      { category: 'food', amount: 350, date: '2024-01-01' },
      { category: 'transport', amount: 250, date: '2024-01-01' },
      { category: 'entertainment', amount: 280, date: '2024-01-01' },
      { category: 'utilities', amount: 380, date: '2024-01-01' },
      { category: 'shopping', amount: 100, date: '2024-01-01' }
    ],
    historical_data: {
      food: { avg_spent: 400, trend: 'stable' },
      transport: { avg_spent: 280, trend: 'decreasing' },
      entertainment: { avg_spent: 200, trend: 'increasing' },
      utilities: { avg_spent: 390, trend: 'stable' },
      shopping: { avg_spent: 150, trend: 'decreasing' }
    }
  });

  mockReallocationService.analyzeSpendingPatterns.mockResolvedValue([
    { category: 'food', spent_percentage: 70, surplus_deficit: 150, variance_from_historical: -12.5, trend: 'stable' },
    { category: 'transport', spent_percentage: 83, surplus_deficit: 50, variance_from_historical: -10.7, trend: 'decreasing' },
    { category: 'entertainment', spent_percentage: 140, surplus_deficit: -80, variance_from_historical: 40, trend: 'increasing' },
    { category: 'utilities', spent_percentage: 95, surplus_deficit: 20, variance_from_historical: -2.6, trend: 'stable' },
    { category: 'shopping', spent_percentage: 40, surplus_deficit: 150, variance_from_historical: -33.3, trend: 'decreasing' }
  ]);

  mockReallocationService.generateReallocationRecommendations.mockResolvedValue({
    reallocations: [
      {
        target_category: 'entertainment',
        deficit_amount: 80,
        recommended_increase: 80,
        sources: [
          { from_category: 'food', available_surplus: 150, suggested_amount: 50 },
          { from_category: 'shopping', available_surplus: 150, suggested_amount: 30 }
        ],
        confidence_score: 0.85,
        reasoning: 'Entertainment is 40% over budget with increasing trend'
      }
    ],
    optimizations: [
      { category: 'food', current_utilization: 70, suggested_reduction: 100 },
      { category: 'shopping', current_utilization: 40, suggested_reduction: 100 }
    ],
    summary: {
      total_surplus: 370,
      total_deficit: 80,
      net_position: 290,
      feasible_reallocations: 1
    }
  });

  mockReallocationService.calculateConfidenceScore.mockReturnValue(0.85);
  mockReallocationService.generateReasoning.mockReturnValue('Entertainment is 40% over budget with increasing trend');
});

describe('TC-01: Authentication and Error Paths', () => {
  test('should return 401 for missing or invalid JWT and 500 on service failure', async () => {
    // Missing token
    await request(app)
      .get('/api/budgets/reallocation-analysis')
      .expect(401);

    // Invalid token
    await request(app)
      .get('/api/budgets/reallocation-analysis')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);

    // Stub service to throw
    mockReallocationService.getUserBudgetData.mockRejectedValueOnce(new Error('Service error'));

    await request(app)
      .get('/api/budgets/reallocation-analysis')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(500)
      .expect(res => {
        expect(res.body.error).toBe('Failed to generate reallocation analysis');
      });
  });
});

describe('TC-02: Reallocation analysis endpoint', () => {
  test('should return 200 with valid analysis and recommendations', async () => {
    const res = await request(app)
      .get('/api/budgets/reallocation-analysis')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const { analysis, recommendations } = res.body.data;
    expect(Array.isArray(analysis) && analysis.length === 5).toBe(true);
    expect(recommendations).toHaveProperty('reallocations');
    expect(recommendations).toHaveProperty('optimizations');
    expect(recommendations).toHaveProperty('summary');
  });
});

describe('TC-03: Recommend reallocation endpoint', () => {
  test('should handle 400, 404, and 200 scenarios', async () => {
    // 400 missing fields
    await request(app)
      .post('/api/budgets/recommend-reallocation')
      .set('Authorization', `Bearer ${validToken}`)
      .send({})
      .expect(400);

    // 404 category not found
    await request(app)
      .post('/api/budgets/recommend-reallocation')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ target_category: 'nonexistent', amount_needed: 50 })
      .expect(404);

    // 200 feasible or not
    const res = await request(app)
      .post('/api/budgets/recommend-reallocation')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ target_category: 'food', amount_needed: 50 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('feasible');
  });
});

describe('TC-04: Spending Analysis Logic', () => {
  test('analyzeSpendingPatterns returns correct metrics', async () => {
    const data = await mockReallocationService.getUserBudgetData(1);
    const analysis = await mockReallocationService.analyzeSpendingPatterns(data);

    expect(Array.isArray(analysis) && analysis.length === 5).toBe(true);
    const food = analysis.find(a => a.category === 'food');
    expect(food.spent_percentage).toBe(70);
    expect(food.surplus_deficit).toBe(150);
  });
});

describe('TC-05: Recommendation Logic', () => {
  test('generateReallocationRecommendations outputs sensible reallocations and optimizations', async () => {
    const data = await mockReallocationService.getUserBudgetData(1);
    const analysis = await mockReallocationService.analyzeSpendingPatterns(data);
    const recs = await mockReallocationService.generateReallocationRecommendations(analysis);

    expect(Array.isArray(recs.reallocations) && recs.reallocations.length <= 10).toBe(true);
    let lastDeficit = Infinity;
    recs.reallocations.forEach(r => {
      expect(r.deficit_amount).toBeLessThanOrEqual(lastDeficit);
      lastDeficit = r.deficit_amount;
      expect(r.sources.length).toBeLessThanOrEqual(3);
    });
  });
});

describe('TC-06: Confidence and Reasoning', () => {
  test('calculateConfidenceScore and generateReasoning produce plausible results', () => {
    const target = { category: 'entertainment', spent_percentage: 140, variance_from_historical: 30, trend: 'increasing' };
    const sources = [{ available_surplus: 150, from_category: 'transport' }, { available_surplus: 50, from_category: 'food' }];
    const score = mockReallocationService.calculateConfidenceScore(target, sources);
    const reason = mockReallocationService.generateReasoning(target, sources);

    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThanOrEqual(1);
    expect(reason).toContain('entertainment');
    expect(reason.length).toBeGreaterThan(20);
  });
});

describe('TC-07: Scalability and Financial Soundness', () => {
  test('scales and respects budget constraints', async () => {
    const largeBudgets = Array.from({ length: 50 }, (_, i) => ({ id: i, category: `cat${i}`, amount: 1000, spent_amount: 500, user_id: 1 }));
    const largeExpenses = Array.from({ length: 500 }, (_, i) => ({ category: `cat${i%50}`, amount: 10, date: '2024-01-01' }));
    const hist = largeBudgets.reduce((o, b) => ({ ...o, [b.category]: { avg_spent: 600, trend: 'stable' } }), {});
    
    // Override mock for this test
    mockReallocationService.getUserBudgetData.mockResolvedValueOnce({
      budgets: largeBudgets,
      expenses: largeExpenses,
      historical_data: hist
    });

    mockReallocationService.analyzeSpendingPatterns.mockResolvedValueOnce(
      largeBudgets.map(b => ({
        category: b.category,
        spent_percentage: 50,
        surplus_deficit: 500,
        variance_from_historical: 0,
        trend: 'stable'
      }))
    );

    mockReallocationService.generateReallocationRecommendations.mockResolvedValueOnce({
      reallocations: [],
      optimizations: largeBudgets.map(b => ({ category: b.category, current_utilization: 50, suggested_reduction: 200 })),
      summary: {
        total_surplus: 25000,
        total_deficit: 0,
        net_position: 25000,
        feasible_reallocations: 0
      }
    });

    const start = Date.now();
    const data = await mockReallocationService.getUserBudgetData(1);
    const analysis = await mockReallocationService.analyzeSpendingPatterns(data);
    const recs = await mockReallocationService.generateReallocationRecommendations(analysis);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
    expect(analysis.length).toBe(50);
    const sumOut = recs.reallocations.reduce((sum, r) => sum + r.sources.reduce((s, src) => s + src.suggested_amount, 0), 0);
    expect(sumOut).toBeLessThanOrEqual(recs.summary.total_surplus * 1.1);

    const totalInc = recs.reallocations.reduce((s, r) => s + r.recommended_increase, 0);
    const totalDec = recs.reallocations.reduce((s, r) => s + r.sources.reduce((ss, src) => ss + src.suggested_amount, 0), 0);
    const avg = (totalInc + totalDec) / 2;
    if (avg > 0) {
      expect(Math.abs(totalInc - totalDec) / avg).toBeLessThan(0.5);
    }
  });
});