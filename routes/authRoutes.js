const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/signup', authController.showSignup);
router.get('/login', authController.showLogin);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);
router.get('/logout', authController.logout);
router.get('/verify-message', authController.showVerifyMessage);
// Forgot password page
router.get('/forgot-password', authController.showForgotPassword);

// Handle forgot password form submission
router.post('/forgot-password', authController.forgotPassword);

// Reset password page (with token in query)
router.get('/reset-password', authController.showResetPassword);

// Handle reset password form submission
router.post('/reset-password', authController.resetPassword);
module.exports = router;
