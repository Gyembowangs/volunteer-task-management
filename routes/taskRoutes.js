const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Admin Routes (with Admin middleware)
router.use('/admin', isAuthenticated, isAdmin);

// Admin Dashboard - Fetch All Tasks
router.get('/admin/dashboard', adminController.getAdminDashboard);

// Create New Task - Only accessible by admins
router.post('/admin/create', isAuthenticated, isAdmin, adminController.createTask);

// Delete Task - Only accessible by admins
router.delete('/admin/delete/:id', isAuthenticated, isAdmin, adminController.deleteTask);

// View Volunteers for a Task - Only accessible by admins
router.get('/admin/volunteers/:id', isAuthenticated, isAdmin, adminController.viewVolunteers);

module.exports = router;
