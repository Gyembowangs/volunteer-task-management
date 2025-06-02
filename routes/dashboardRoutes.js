const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Protected route for user dashboard
router.get('/dashboard', isAuthenticated, dashboardController.getUserDashboard);

module.exports = router;
