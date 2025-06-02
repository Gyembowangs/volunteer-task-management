const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard', isAuthenticated, isAdmin, adminController.getAdminDashboard);
router.post('/create-task', isAuthenticated, isAdmin, adminController.createTask);
router.post('/delete/:id', isAuthenticated, isAdmin, adminController.deleteTask);

// Fix here: use the existing edit task POST route and handler
router.post('/edit-task/:id', isAuthenticated, isAdmin, adminController.postEditTask);

router.get('/volunteers/:id', isAuthenticated, isAdmin, adminController.viewVolunteers);
router.get('/generate-link/:id', isAuthenticated, isAdmin, adminController.generateLink);
router.get('/volunteers/:id/download', isAuthenticated, isAdmin, adminController.downloadVolunteersCSV);

module.exports = router;
