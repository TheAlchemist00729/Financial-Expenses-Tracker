const db = require('../db');

const listBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[LIST BUDGETS] Fetching budgets for user:', userId);
    
    const result = await db.query(
      'SELECT * FROM budgets WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    console.log('[LIST BUDGETS] Found budgets:', result.rows.length);
    console.log('[LIST BUDGETS] Budgets data:', result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('[LIST BUDGETS] Error fetching budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getBudgetStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        b.id,
        b.name,
        b.amount as budget_amount,
        b.category,
        b.period_type,
        b.start_date,
        b.end_date,
        COALESCE(SUM(e.amount), 0) as spent_amount,
        ROUND((COALESCE(SUM(e.amount), 0) / b.amount) * 100, 2) as percentage_used
      FROM budgets b
      LEFT JOIN expenses e ON b.category = e.category 
        AND e.user_id = b.user_id
        AND e.date >= b.start_date 
        AND e.date <= b.end_date
      WHERE b.user_id = $1
      GROUP BY b.id, b.name, b.amount, b.category, b.period_type, b.start_date, b.end_date
      ORDER BY b.created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budget status:', error);
    res.status(500).json({ error: 'Failed to fetch budget status' });
  }
};

const getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getBudgetExpenses = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const budgetResult = await db.query(
      'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (budgetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const budget = budgetResult.rows[0];
    
    // Fixed: Join by category instead of budget_id
    const expensesResult = await db.query(`
      SELECT * FROM expenses 
      WHERE category = $1 
        AND user_id = $2
        AND date >= $3 
        AND date <= $4
      ORDER BY date DESC
    `, [budget.category, userId, budget.start_date, budget.end_date]);
    
    res.json(expensesResult.rows);
  } catch (error) {
    console.error('Error fetching budget expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const validateBudget = (req, res, next) => {
  console.log('[VALIDATE BUDGET] Request body:', req.body);
  
  const { name, amount, category, start_date, end_date } = req.body;
  
  if (!name || !amount || !category || !start_date || !end_date) {
    console.log('[VALIDATE BUDGET] Missing required fields');
    return res.status(400).json({ 
      error: 'Missing required fields: name, amount, category, start_date, end_date' 
    });
  }
  
  if (amount <= 0) {
    console.log('[VALIDATE BUDGET] Invalid amount:', amount);
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  
  if (new Date(start_date) >= new Date(end_date)) {
    console.log('[VALIDATE BUDGET] Invalid dates - start:', start_date, 'end:', end_date);
    return res.status(400).json({ error: 'Start date must be before end date' });
  }
  
  console.log('[VALIDATE BUDGET] Validation passed');
  next();
};

const createBudget = async (req, res) => {
  try {
    console.log('[CREATE BUDGET] Request body:', req.body);
    console.log('[CREATE BUDGET] User ID:', req.user.id);
    
    const { name, amount, category, period_type, start_date, end_date } = req.body;
    const userId = req.user.id;
    
    // Additional validation for period_type since it's required in schema
    if (!name || !amount || !category || !period_type || !start_date || !end_date) {
      console.log('[CREATE BUDGET] Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: name, amount, category, period_type, start_date, end_date' 
      });
    }
    
    console.log('[CREATE BUDGET] Creating budget with data:', {
      userId, name, amount, category, period_type, start_date, end_date
    });
    
    const result = await db.query(
      `INSERT INTO budgets (user_id, name, amount, category, period_type, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, name, amount, category, period_type, start_date, end_date]
    );
    
    console.log('[CREATE BUDGET] Budget created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[CREATE BUDGET] Error creating budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, category, period_type, start_date, end_date } = req.body;
    const userId = req.user.id;
    
    const result = await db.query(
      `UPDATE budgets 
       SET name = $1, amount = $2, category = $3, period_type = $4, start_date = $5, end_date = $6
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, amount, category, period_type, start_date, end_date, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await db.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  listBudgets,
  getBudgetStatus,
  getBudgetById,
  getBudgetExpenses,
  validateBudget,
  createBudget,
  updateBudget,
  deleteBudget
};