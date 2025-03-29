const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config/config');
const { setupAdmin } = require('./utils/admin');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const noteRoutes = require('./routes/noteRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  createParentPath: true
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notes', noteRoutes);

// Frontend routes
app.get('/', (req, res) => {
  // Check if user is authenticated via JWT token in cookie
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, config.jwtSecret);
      // If token is valid, redirect to dashboard
      return res.redirect('/dashboard');
    } catch (error) {
      // If token is invalid, clear it
      res.clearCookie('token');
    }
  }
  // If not authenticated, show the home page
  res.render('pages/index', { title: config.app.name, path: req.path });
});

app.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Login', path: req.path });
});

app.get('/register', (req, res) => {
  const accessCode = req.query.code || '';
  res.render('pages/register', { title: 'Register', accessCode, path: req.path });
});

app.get('/verify-email', (req, res) => {
  const token = req.query.token || '';
  res.render('pages/verify-email', { title: 'Verify Email', token, path: req.path });
});

app.get('/verify-email-pending', (req, res) => {
  res.render('pages/verify-email-pending', { title: 'Verify Email', path: req.path });
});

app.get('/dashboard', (req, res) => {
  // Check if user is authenticated via JWT token in cookie
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    jwt.verify(token, config.jwtSecret);
    res.render('pages/dashboard', { title: 'Dashboard', path: req.path });
  } catch (error) {
    // If token is invalid, clear it and redirect to login
    res.clearCookie('token');
    res.redirect('/login');
  }
});

// Tutor routes
app.get('/tutor/invite', (req, res) => {
  res.render('pages/invite', { title: 'Invite Pupil', path: req.path });
});

app.get('/tutor/pupils', (req, res) => {
  // Check if user is authenticated
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    jwt.verify(token, config.jwtSecret);
    res.render('pages/pupils', { title: 'My Pupils', path: req.path });
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
});

app.get('/tutor/pupils/:pupilId', (req, res) => {
  res.render('pages/pupil-details', { title: 'Pupil Details', path: req.path });
});

// Pupil routes
app.get('/pupil/profile', (req, res) => {
  res.render('pages/dashboard', { title: 'My Profile', path: req.path });
});

// Messaging routes
app.get('/messages', (req, res) => {
  // Check if user is authenticated
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    jwt.verify(token, config.jwtSecret);
    res.render('pages/messages', { title: 'Messages', path: req.path });
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
});

app.get('/messages/conversation/:userId', (req, res) => {
  // Check if user is authenticated
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    jwt.verify(token, config.jwtSecret);
    res.render('pages/message', { title: 'Messages', path: '/messages' });
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
});

// Admin routes
app.get('/admin/users', (req, res) => {
  res.render('pages/dashboard', { title: 'Manage Users', path: '/admin' });
});

app.get('/admin/users/:userId', (req, res) => {
  res.render('pages/dashboard', { title: 'User Details', path: '/admin' });
});

app.get('/admin/access-codes', (req, res) => {
  res.render('pages/dashboard', { title: 'Access Codes', path: '/admin' });
});

app.get('/profile-setup', (req, res) => {
  // Check if user is authenticated
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    jwt.verify(token, config.jwtSecret);
    res.render('pages/profile-setup', { title: 'Complete Your Profile', path: req.path });
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
});

app.get('/profile', (req, res) => {
  // Check if user is authenticated
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    jwt.verify(token, config.jwtSecret);
    res.render('pages/profile-setup', { title: 'Edit Profile', path: req.path });
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
});

// Catch-all route for the SPA
app.get('*', (req, res) => {
  res.redirect('/dashboard');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Setup admin user
setupAdmin().then(() => {
  // Start the server
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`App URL: ${config.app.url}`);
  });
});

module.exports = app; 