const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usersController');

router.post('/signup', ctrl.signup);

module.exports = router;