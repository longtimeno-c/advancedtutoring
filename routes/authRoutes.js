const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Verify email
router.get('/verify-email', authController.verifyEmail);

// Logout user
router.post('/logout', isAuthenticated, authController.logout);

// Get current user
router.get('/me', isAuthenticated, authController.getCurrentUser);

module.exports = router; 