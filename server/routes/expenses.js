const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/auth');
const ctrl = require('../controllers/expensesController');

router.use(ensureAuth);

router.post('/', ctrl.createExpense);

router.delete('/:id', ctrl.deleteExpense);

router.get('/', ctrl.listExpenses);
router.get('/summary', ctrl.summary);

module.exports = router;

