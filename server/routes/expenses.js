const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/auth');
const ctrl = require('../controllers/expensesController');
const logErrorToFile = require('../middleware/logger');

router.use(ensureAuth);

router.post('/', ctrl.validateExpense, async (req, res) => {
  try {
    await ctrl.createExpense(req, res);
  } catch (err) {
    logErrorToFile(err, req);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ctrl.deleteExpense(req, res);
  } catch (err) {
    logErrorToFile(err, req);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    await ctrl.summary(req, res);
  } catch (err) {
    logErrorToFile(err, req);
    res.status(500).json({ error: 'Failed to load summary' });
  }
});

router.get('/', async (req, res) => {
  try {
    await ctrl.listExpenses(req, res);
  } catch (err) {
    logErrorToFile(err, req);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

module.exports = router;

