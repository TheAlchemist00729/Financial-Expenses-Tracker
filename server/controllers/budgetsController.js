const db = require('../db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

exports.validateBudget = (req, res, next) => {
  const { name, amount, category, period } = req.body;
  if (
    !name?.trim() ||
    amount == null ||
    typeof amount !== 'number' ||
    !category?.trim() ||
    !period?.trim()
  ) {
    return res
      .status(HTTP_BAD_REQUEST)
      .json({ error: 'All fields (name, amount, category, period) are required and must be valid' });
  }

  if (amount <= 0) {
    return res.status(HTTP_BAD_REQUEST).json({ error: 'Amount must be greater than 0' });
  }

  req.body.name = name.trim();
  req.body.category = category.trim();
  req.body.period = period.trim();
  next();
};

exports.createBudget = async (req, res) => {
  const { name, amount, category, period } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO budgets(user_id, name, amount, category, period, created_at)
       VALUES($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, name, amount, category, period, created_at`,
      [req.user.id, name, amount, category, period]
    );
    return res.status(201).json({ budget: rows[0] });
  } catch (err) {
    console.error('[createBudget] Error:', err);
    return res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to create budget' });
  }
};

exports.listBudgets = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, user_id, name, amount, category, period, created_at
       FROM budgets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ budgets: rows });
  } catch (err) {
    console.error('[listBudgets] Error:', err);
    return res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to fetch budgets' });
  }
};

exports.getBudgetById = async (req, res) => {
  const budgetId = parseInt(req.params.id, 10);
  if (isNaN(budgetId)) {
    return res.status(HTTP_BAD_REQUEST).json({ error: 'Invalid budget ID' });
  }

  try {
    const { rows, rowCount } = await db.query(
      `SELECT id, user_id, name, amount, category, period, created_at
       FROM budgets
       WHERE id = $1 AND user_id = $2`,
      [budgetId, req.user.id]
    );
    
    if (rowCount === 0) {
      return res.status(HTTP_NOT_FOUND).json({ error: 'Budget not found' });
    }
    
    return res.json({ budget: rows[0] });
  } catch (err) {
    console.error('[getBudgetById] Error:', err);
    return res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to fetch budget' });
  }
};

exports.updateBudget = async (req, res) => {
  const budgetId = parseInt(req.params.id, 10);
  if (isNaN(budgetId)) {
    return res.status(HTTP_BAD_REQUEST).json({ error: 'Invalid budget ID' });
  }

  const { name, amount, category, period } = req.body;
  try {
    const { rows, rowCount } = await db.query(
      `UPDATE budgets 
       SET name = $1, amount = $2, category = $3, period = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, user_id, name, amount, category, period, created_at`,
      [name, amount, category, period, budgetId, req.user.id]
    );
    
    if (rowCount === 0) {
      return res.status(HTTP_NOT_FOUND).json({ error: 'Budget not found' });
    }
    
    return res.json({ budget: rows[0] });
  } catch (err) {
    console.error('[updateBudget] Error:', err);
    return res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to update budget' });
  }
};

exports.deleteBudget = async (req, res) => {
  const budgetId = parseInt(req.params.id, 10);
  if (isNaN(budgetId)) {
    return res.status(HTTP_BAD_REQUEST).json({ error: 'Invalid budget ID' });
  }

  try {
    const { rowCount } = await db.query(
      `DELETE FROM budgets WHERE id = $1 AND user_id = $2`,
      [budgetId, req.user.id]
    );
    
    if (rowCount === 0) {
      return res.status(HTTP_NOT_FOUND).json({ error: 'Budget not found' });
    }
    
    return res.json({ deletedId: budgetId });
  } catch (err) {
    console.error('[deleteBudget] Error:', err);
    return res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to delete budget' });
  }
};

exports.getBudgetStatus = async (req, res) => {
  try {
    const budgetsQuery = await db.query(
      `SELECT id, name, amount, category, period, created_at
       FROM budgets
       WHERE user_id = $1`,
      [req.user.id]
    );

    const expensesQuery = await db.query(
      `SELECT category, SUM(amount)::numeric(10,2) AS total_spent
       FROM expenses
       WHERE user_id = $1
       GROUP BY category`,
      [req.user.id]
    );

    const budgets = budgetsQuery.rows;
    const expensesByCategory = {};
    
    expensesQuery.rows.forEach(expense => {
      expensesByCategory[expense.category] = parseFloat(expense.total_spent);
    });

    const budgetStatus = budgets.map(budget => {
      const spent = expensesByCategory[budget.category] || 0;
      const remaining = budget.amount - spent;
      const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        ...budget,
        spent: spent,
        remaining: remaining,
        percentUsed: Math.round(percentUsed * 100) / 100, // Round to 2 decimals
        status: percentUsed >= 100 ? 'over' : percentUsed >= 80 ? 'warning' : 'good'
      };
    });

    return res.json({ budgetStatus });
  } catch (err) {
    console.error('[getBudgetStatus] Error:', err);
    return res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to fetch budget status' });
  }
};

exports.getBudgetExpenses = async (req, res) => {
  const budgetId = parseInt(req.params.id, 10);
  if (isNaN(budgetId)) {
    return res.status(HTTP_BAD_REQUEST).json({ error: 'Invalid budget ID' });
  }

  try {
    const budgetQuery = await db.query(
      `SELECT id, name, category FROM budgets WHERE id = $1 AND user_id = $2`,
      [budgetId, req.user.id]
    );

    if (budgetQuery.rowCount === 0) {
      return res.status(HTTP_NOT_FOUND).json({ error: 'Budget not found' });
    }

    const budget = budgetQuery.rows[0];

    const expensesQuery = await db.query(
      `SELECT id, amount, description, date, category
       FROM expenses
       WHERE user_id = $1 AND category = $2
       ORDER BY date DESC`,
      [req.user.id, budget.category]
    );

    return res.json({
      budget: budget,
      expenses: expensesQuery.rows
    });
  } catch (err) {
    console.error('[getBudgetExpenses] Error:', err);
    return res.status(HTTP_SERVER_ERROR).json({ error: 'Failed to fetch budget expenses' });
  }
};