const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { amount, category, month } = req.body;

  if (!amount || !category || !month) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const query = `
      INSERT INTO budgets (amount, category, month, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [amount, category, month, req.user.id];

    const result = await db.query(query, values);
    const budget = result.rows[0];

    res.status(200).json({ budget });
  } catch (err) {
    console.error('Error creating budget:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


