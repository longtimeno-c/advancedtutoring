const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Check if user is verified
const isVerified = (req, res, next) => {
  const userId = req.user.id;
  const user = User.getUserById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.verified) {
    return res.status(403).json({ message: 'Email verification required' });
  }

  next();
};

// Check if user has admin role
const isAdmin = (req, res, next) => {
  // First ensure the user is authenticated
  if (!req.session.userId && !req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userId = req.session.userId || req.user.id;
  const user = User.getUserById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role !== User.ROLES.ADMIN) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

// Check if user is a tutor
const isTutor = (req, res, next) => {
  // First ensure the user is authenticated
  if (!req.session.userId && !req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userId = req.session.userId || req.user.id;
  const user = User.getUserById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role !== User.ROLES.TUTOR && user.role !== User.ROLES.ADMIN) {
    return res.status(403).json({ message: 'Tutor access required' });
  }

  next();
};

// Check if current user is the tutor of the specified pupil
const isTutorOfPupil = (req, res, next) => {
  // First ensure the user is authenticated
  if (!req.session.userId && !req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userId = req.session.userId || req.user.id;
  const user = User.getUserById(userId);
  const pupilId = req.params.pupilId || req.body.pupilId;

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!pupilId) {
    return res.status(400).json({ message: 'Pupil ID is required' });
  }

  if (user.role === User.ROLES.ADMIN) {
    // Admins can access all pupils
    return next();
  }

  if (user.role !== User.ROLES.TUTOR) {
    return res.status(403).json({ message: 'Tutor access required' });
  }

  // Check if the pupil is assigned to this tutor
  if (!user.pupils.includes(pupilId)) {
    return res.status(403).json({ message: 'You are not the tutor of this pupil' });
  }

  next();
};

// Check if current user can message the other user
const canMessageUser = (req, res, next) => {
  // First ensure the user is authenticated
  if (!req.session.userId && !req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userId = req.session.userId || req.user.id;
  const user = User.getUserById(userId);
  const receiverId = req.params.receiverId || req.body.receiverId;

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!receiverId) {
    return res.status(400).json({ message: 'Receiver ID is required' });
  }

  const receiver = User.getUserById(receiverId);
  if (!receiver) {
    return res.status(404).json({ message: 'Receiver not found' });
  }

  // Admin can message anyone
  if (user.role === User.ROLES.ADMIN) {
    return next();
  }

  // Tutor can message their pupils
  if (user.role === User.ROLES.TUTOR && user.pupils.includes(receiverId)) {
    return next();
  }

  // Pupil can message their tutor
  if (user.role === User.ROLES.PUPIL && user.tutorId === receiverId) {
    return next();
  }

  return res.status(403).json({ message: 'You are not allowed to message this user' });
};

module.exports = {
  isAuthenticated,
  isVerified,
  isAdmin,
  isTutor,
  isTutorOfPupil,
  canMessageUser
}; 