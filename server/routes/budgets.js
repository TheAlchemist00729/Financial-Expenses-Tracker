const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/auth');
const budgetsController = require('../controllers/budgetsController');

router.use(ensureAuth);

router.get('/', budgetsController.listBudgets);

router.get('/status', budgetsController.getBudgetStatus);

router.get('/:id', budgetsController.getBudgetById);

router.get('/:id/expenses', budgetsController.getBudgetExpenses);

router.post('/', budgetsController.validateBudget, budgetsController.createBudget);

router.put('/:id', budgetsController.validateBudget, budgetsController.updateBudget);

router.delete('/:id', budgetsController.deleteBudget);

module.exports = router;