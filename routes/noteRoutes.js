const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { isAuthenticated, isVerified, isTutorOfPupil } = require('../middleware/auth');

// Get notes for a pupil
router.get('/pupil/:pupilId', isAuthenticated, isVerified, isTutorOfPupil, noteController.getNotesForPupil);

// Create a note for a pupil
router.post('/pupil/:pupilId', isAuthenticated, isVerified, isTutorOfPupil, noteController.createNote);

// Update a note
router.put('/:noteId', isAuthenticated, isVerified, noteController.updateNote);

// Delete a note
router.delete('/:noteId', isAuthenticated, isVerified, noteController.deleteNote);

module.exports = router; 