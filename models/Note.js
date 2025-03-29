const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const NOTES_FILE = path.join(__dirname, '../data/notes.json');

// Initialize notes file if it doesn't exist
if (!fs.existsSync(NOTES_FILE)) {
  fs.writeFileSync(NOTES_FILE, '[]', 'utf8');
}

// Get all notes
const getNotes = () => {
  const notesData = fs.readFileSync(NOTES_FILE, 'utf8');
  return JSON.parse(notesData);
};

// Save notes
const saveNotes = (notes) => {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf8');
};

// Get notes for a pupil
const getNotesForPupil = (pupilId) => {
  const notes = getNotes();
  return notes.filter(note => note.pupilId === pupilId);
};

// Get a single note by ID
const getNoteById = (noteId) => {
  const notes = getNotes();
  return notes.find(note => note.id === noteId);
};

// Create a new note
const createNote = (tutorId, pupilId, content) => {
  const notes = getNotes();
  const newNote = {
    id: uuidv4(),
    tutorId,
    pupilId,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  notes.push(newNote);
  saveNotes(notes);
  return newNote;
};

// Update a note
const updateNote = (noteId, content) => {
  const notes = getNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) {
    throw new Error('Note not found');
  }
  
  notes[noteIndex] = {
    ...notes[noteIndex],
    content,
    updatedAt: new Date().toISOString()
  };
  
  saveNotes(notes);
  return notes[noteIndex];
};

// Delete a note
const deleteNote = (noteId) => {
  const notes = getNotes();
  const filteredNotes = notes.filter(note => note.id !== noteId);
  
  if (filteredNotes.length === notes.length) {
    throw new Error('Note not found');
  }
  
  saveNotes(filteredNotes);
};

module.exports = {
  getNotesForPupil,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
}; 