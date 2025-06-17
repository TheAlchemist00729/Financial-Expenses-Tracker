const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/auth');
const { getVisualizationData, getBudgetPerformance } = require('../controllers/visualizationController');

router.use(ensureAuth);

router.get('/data', getVisualizationData);
router.get('/budget-performance', getBudgetPerformance);

router.get('/monthly-spending', getVisualizationData);

module.exports = router;