const express = require('express');
const router = express.Router();
const { testEmail, checkEmailConfig } = require('../controllers/testController');

// Test email routes
router.post('/email', testEmail);
router.get('/email/config', checkEmailConfig);

module.exports = router;
