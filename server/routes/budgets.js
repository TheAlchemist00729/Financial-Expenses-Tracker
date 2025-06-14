const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const result = await db.query(
      `SELECT b.*, 
       COALESCE(SUM(e.amount), 0) as spent_amount
       FROM budgets b
       LEFT JOIN expenses e ON e.user_id = b.user_id 
         AND e.date >= b.start_date 
         AND e.date <= b.end_date
         AND (b.category IS NULL OR LOWER(e.category) = LOWER(b.category))
       WHERE b.user_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [userId]
    );
    res.json({ budgets: result.rows });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const result = await db.query(
      `SELECT b.*, 
       COALESCE(SUM(e.amount), 0) as spent_amount,
       CASE 
         WHEN COALESCE(SUM(e.amount), 0) >= b.amount THEN 'exceeded'
         WHEN COALESCE(SUM(e.amount), 0) >= (b.amount * 0.8) THEN 'warning'
         ELSE NULL
       END as alert_type,
       ROUND((COALESCE(SUM(e.amount), 0) / b.amount) * 100, 2) as percentage_used
       FROM budgets b
       LEFT JOIN expenses e ON e.user_id = b.user_id 
         AND e.date >= b.start_date 
         AND e.date <= b.end_date
         AND (b.category IS NULL OR LOWER(e.category) = LOWER(b.category))
       WHERE b.user_id = $1
         AND b.end_date >= CURRENT_DATE
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [userId]
    );
    res.json({ budgetStatus: result.rows });
  } catch (error) {
    console.error('Error fetching budget status:', error);
    res.status(500).json({ error: 'Failed to fetch budget status' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const budgetId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await db.query(
      `SELECT b.*, 
       COALESCE(SUM(e.amount), 0) as spent_amount
       FROM budgets b
       LEFT JOIN expenses e ON e.user_id = b.user_id 
         AND e.date >= b.start_date 
         AND e.date <= b.end_date
         AND (b.category IS NULL OR LOWER(e.category) = LOWER(b.category))
       WHERE b.user_id = $1 AND b.id = $2
       GROUP BY b.id`,
      [userId, budgetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ budget: result.rows[0] });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, amount, category, period_type, start_date, end_date } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name || !amount || !period_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!['weekly', 'monthly', 'yearly'].includes(period_type)) {
      return res.status(400).json({ error: 'Invalid period_type. Must be weekly, monthly, or yearly' });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const result = await db.query(
      `INSERT INTO budgets (user_id, name, amount, category, period_type, start_date, end_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [userId, name, amount, category || null, period_type, start_date, end_date]
    );

    res.status(201).json({ budget: result.rows[0] });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const budgetId = req.params.id;
    const { name, amount, category, start_date, end_date } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name || !amount || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const result = await db.query(
      `UPDATE budgets 
       SET name = $1, amount = $2, category = $3, start_date = $4, end_date = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, amount, category || null, start_date, end_date, budgetId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ budget: result.rows[0] });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const budgetId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await db.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
      [budgetId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

module.exports = router;