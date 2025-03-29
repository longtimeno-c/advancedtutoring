const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const AccessCode = require('../models/AccessCode');
const { sendVerificationEmail } = require('../utils/email');
const config = require('../config/config');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, accessCode } = req.body;

    // Validate required fields
    if (!email || !password || !accessCode) {
      return res.status(400).json({ message: 'Email, password, and access code are required' });
    }

    // Validate access code
    const validationResult = AccessCode.validateAccessCode(accessCode);
    if (!validationResult.valid) {
      return res.status(400).json({ message: validationResult.message });
    }

    // Default role from access code
    const role = validationResult.accessCode.targetRole;
    
    // Create verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);

    // Create user
    const userData = {
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      role,
      verified: !config.email.enabled, // Auto-verify if email is disabled
      verificationToken: config.email.enabled ? verificationToken : null,
      creatorId: validationResult.accessCode.creatorId
    };

    // If user is a pupil, set their tutor
    if (role === User.ROLES.PUPIL) {
      userData.tutorId = validationResult.accessCode.creatorId;
    }

    const newUser = await User.createUser(userData);

    // Use the access code
    AccessCode.useAccessCode(accessCode, newUser.id);

    // If user is a pupil and has a tutor, add them to the tutor's pupils list
    if (role === User.ROLES.PUPIL && userData.tutorId) {
      User.addPupilToTutor(userData.tutorId, newUser.id);
    }

    // Send verification email if enabled
    if (config.email.enabled) {
      await sendVerificationEmail(newUser, verificationToken);
    }

    // Create a JWT token for the user
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      config.jwtSecret,
      { expiresIn: '1d' }
    );

    // Set session
    req.session.userId = newUser.id;

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Authenticate user
    const user = await User.authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create a JWT token for the user
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '1d' }
    );

    // Set session
    req.session.userId = user.id;

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(200).json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Verify email
const verifyEmail = (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = User.verifyUser(token);

    res.status(200).json({
      message: 'Email verified successfully',
      user
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Logout user
const logout = (req, res) => {
  // Clear session
  req.session.destroy();

  // Clear cookie
  res.clearCookie('token');

  res.status(200).json({ message: 'Logout successful' });
};

// Get current user
const getCurrentUser = (req, res) => {
  try {
    const userId = req.session.userId || req.user.id;
    const user = User.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  logout,
  getCurrentUser
}; 