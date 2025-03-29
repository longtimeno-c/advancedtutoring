const Note = require('../models/Note');
const User = require('../models/User');

// Get notes for a pupil
const getNotesForPupil = (req, res) => {
  try {
    const { pupilId } = req.params;
    const tutorId = req.session.userId || req.user.id;
    
    // Verify tutor has access to this pupil
    const tutor = User.getUserById(tutorId);
    if (!tutor.pupils.includes(pupilId) && tutor.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have access to this pupil\'s notes' });
    }
    
    const notes = Note.getNotesForPupil(pupilId);
    res.status(200).json({ notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a note
const createNote = (req, res) => {
  try {
    const { pupilId } = req.params;
    const { content } = req.body;
    const tutorId = req.session.userId || req.user.id;
    
    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }
    
    // Verify tutor has access to this pupil
    const tutor = User.getUserById(tutorId);
    if (!tutor.pupils.includes(pupilId) && tutor.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have access to this pupil' });
    }
    
    const note = Note.createNote(tutorId, pupilId, content);
    res.status(201).json({ note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update a note
const updateNote = (req, res) => {
  try {
    const { noteId } = req.params;
    const { content } = req.body;
    const tutorId = req.session.userId || req.user.id;
    
    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }
    
    // Get the note
    const note = Note.getNoteById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Verify tutor owns this note
    if (note.tutorId !== tutorId) {
      return res.status(403).json({ message: 'You do not have permission to update this note' });
    }
    
    const updatedNote = Note.updateNote(noteId, content);
    res.status(200).json({ note: updatedNote });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a note
const deleteNote = (req, res) => {
  try {
    const { noteId } = req.params;
    const tutorId = req.session.userId || req.user.id;
    
    // Get the note
    const note = Note.getNoteById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Verify tutor owns this note
    if (note.tutorId !== tutorId) {
      return res.status(403).json({ message: 'You do not have permission to delete this note' });
    }
    
    Note.deleteNote(noteId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotesForPupil,
  createNote,
  updateNote,
  deleteNote
}; 