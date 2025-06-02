const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');

// Apply to a task route
router.post('/apply/:id', volunteerController.applyForTask);

module.exports = router;
