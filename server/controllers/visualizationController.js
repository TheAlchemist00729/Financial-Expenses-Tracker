const db = require('../db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const HTTP_SERVER_ERROR = 500;

exports.getVisualizationData = async (req, res) => {
  const userId = req.user.id;

  try {
    const budgetQuery = `
      SELECT 
        b.category,
        b.amount as budget_amount,
        COALESCE(e.spent_amount, 0) as spent_amount,
        (b.amount - COALESCE(e.spent_amount, 0)) as remaining_amount
      FROM budgets b
      LEFT JOIN (
        SELECT 
          category,
          SUM(amount) as spent_amount
        FROM expenses
        WHERE user_id = $1
        GROUP BY category
      ) e ON b.category = e.category
      WHERE b.user_id = $1
      ORDER BY b.category
    `;

    const expenseTrendsQuery = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as period,
        SUM(amount) as total_amount
      FROM expenses
      WHERE user_id = $1
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY period DESC
      LIMIT 12
    `;

    const dailySpendingQuery = `
      SELECT 
        date::date as date,
        SUM(amount) as daily_total
      FROM expenses
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date::date
      ORDER BY date
    `;

    const categoryBreakdownQuery = `
      SELECT 
        category,
        SUM(amount) as total_amount
      FROM expenses
      WHERE user_id = $1
      GROUP BY category
      ORDER BY total_amount DESC
    `;

    const budgetUtilizationQuery = `
      SELECT 
        b.category,
        b.amount as budget_amount,
        COALESCE(e.spent_amount, 0) as spent_amount,
        (b.amount - COALESCE(e.spent_amount, 0)) as remaining_amount,
        CASE 
          WHEN b.amount > 0 THEN (COALESCE(e.spent_amount, 0) / b.amount * 100)
          ELSE 0
        END as utilization_percentage
      FROM budgets b
      LEFT JOIN (
        SELECT 
          category,
          SUM(amount) as spent_amount
        FROM expenses
        WHERE user_id = $1
        GROUP BY category
      ) e ON b.category = e.category
      WHERE b.user_id = $1
      ORDER BY utilization_percentage DESC
    `;

    const [budgetData, expenseTrends, dailySpending, categoryBreakdown, budgetUtilization] = await Promise.all([
      db.query(budgetQuery, [userId]),
      db.query(expenseTrendsQuery, [userId]),
      db.query(dailySpendingQuery, [userId]),
      db.query(categoryBreakdownQuery, [userId]),
      db.query(budgetUtilizationQuery, [userId])
    ]);

    res.json({
      budgetData: budgetData.rows,
      expenseTrends: expenseTrends.rows,
      dailySpending: dailySpending.rows,
      categoryBreakdown: categoryBreakdown.rows,
      budgetUtilization: budgetUtilization.rows
    });

  } catch (error) {
    console.error('[getVisualizationData] Error:', error);
    res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to fetch visualization data' });
  }
};

exports.getBudgetPerformance = async (req, res) => {
  const userId = req.user.id;

  try {
    const performanceQuery = `
      SELECT 
        COUNT(*) as total_budgets,
        COUNT(CASE WHEN spent_amount > budget_amount THEN 1 END) as categories_over_budget,
        AVG(CASE WHEN budget_amount > 0 THEN (spent_amount / budget_amount * 100) ELSE 0 END) as avg_utilization,
        CASE 
          WHEN COUNT(CASE WHEN spent_amount > budget_amount THEN 1 END) = 0 THEN 'Good'
          WHEN COUNT(CASE WHEN spent_amount > budget_amount THEN 1 END) <= COUNT(*) * 0.3 THEN 'Warning'
          ELSE 'Critical'
        END as overall_health
      FROM (
        SELECT 
          b.category,
          b.amount as budget_amount,
          COALESCE(e.spent_amount, 0) as spent_amount
        FROM budgets b
        LEFT JOIN (
          SELECT 
            category,
            SUM(amount) as spent_amount
          FROM expenses
          WHERE user_id = $1
          GROUP BY category
        ) e ON b.category = e.category
        WHERE b.user_id = $1
      ) budget_analysis
    `;

    const result = await db.query(performanceQuery, [userId]);
    
    res.json(result.rows[0] || {
      total_budgets: 0,
      categories_over_budget: 0,
      avg_utilization: 0,
      overall_health: 'Good'
    });

  } catch (error) {
    console.error('[getBudgetPerformance] Error:', error);
    res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to fetch budget performance data' });
  }
};