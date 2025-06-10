const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/auth');
const ctrl = require('../controllers/expensesController');

router.use(ensureAuth);

router.post('/', ctrl.validateExpense, ctrl.createExpense);

router.delete('/:id', ctrl.deleteExpense);

router.get('/summary', ctrl.summary);
router.get('/', ctrl.listExpenses);

module.exports = router;


