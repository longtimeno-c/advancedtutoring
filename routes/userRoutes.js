const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isVerified, isTutor, isTutorOfPupil } = require('../middleware/auth');

// Get current user
router.get('/me', isAuthenticated, userController.getUserById);

// Update user profile
router.put('/profile', isAuthenticated, isVerified, userController.updateProfile);

// Get pupils for tutor
router.get('/tutor/pupils', isAuthenticated, isVerified, isTutor, userController.getPupilsForTutor);

// Get tutor for pupil
router.get('/pupil/tutor', isAuthenticated, isVerified, userController.getTutorForPupil);

// Create access code for inviting pupils
router.post('/access-code', isAuthenticated, isVerified, isTutor, userController.createAccessCodeForUser);

// Get access codes created by current user
router.get('/access-code/mine', isAuthenticated, isVerified, userController.getMyAccessCodes);

// Get user by ID
router.get('/:userId', isAuthenticated, isVerified, userController.getUserById);

// Update user
router.put('/:userId', isAuthenticated, isVerified, userController.updateUser);

module.exports = router; 