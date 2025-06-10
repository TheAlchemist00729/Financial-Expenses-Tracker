const express = require('express');
const path = require('path');
const router = express.Router();
const ensureAuth = require('../middleware/auth');
const db = require('../db');

const HTTP_BAD_REQUEST = 400;
const HTTP_CREATED = 201;
const HTTP_SERVER_ERROR = 500;

function validateBudget(req, res, next) {
  const { amount, category, month } = req.body;
  if (
    amount == null ||
    typeof amount !== 'number' ||
    !category?.trim() ||
    !month?.trim()
  ) {
    return res
      .status(HTTP_BAD_REQUEST)
      .json({ error: 'Amount must be a number, category and month are required' });
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res
      .status(HTTP_BAD_REQUEST)
      .json({ error: 'Month must be in YYYY-MM format' });
  }

  req.body.category = category.trim();
  req.body.month = month.trim();
  next();
}

router.use(ensureAuth);

router.post('/', validateBudget, async (req, res) => {
  const { amount, category, month } = req.body;
  const userId = req.user.id;

  try {
    const query = `
      INSERT INTO budgets (amount, category, month, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, amount, category, month, user_id
    `;
    const values = [amount, category, month, userId];

    const { rows } = await db.query(query, values);
    return res.status(HTTP_CREATED).json({ budget: rows[0] });
  } catch (err) {
    console.error('[Budget] Error creating budget:', err);
    return res.status(HTTP_SERVER_ERROR).json({ error: 'Internal server error' });
  }
});

module.exports = router;


