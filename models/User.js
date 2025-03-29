const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// User roles
const ROLES = {
  ADMIN: 'admin',
  TUTOR: 'tutor',
  PUPIL: 'pupil'
};

// Path to the users data file
const dataPath = path.join(__dirname, '../data/users.json');

// Initialize users data file if it doesn't exist
const initUsersData = () => {
  if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  }
  
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
  }
};

// Get all users
const getUsers = () => {
  initUsersData();
  const data = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(data);
};

// Save users to file
const saveUsers = (users) => {
  fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));
};

// Create a new user
const createUser = async (userData) => {
  const users = getUsers();
  
  // Check if user with this email already exists
  if (users.find(user => user.email === userData.email)) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const newUser = {
    id: uuidv4(),
    email: userData.email,
    password: hashedPassword,
    role: userData.role || ROLES.PUPIL,
    verified: userData.verified || false,
    verificationToken: userData.verificationToken || uuidv4(),
    accessCode: userData.accessCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tutorId: userData.tutorId || null,
    pupils: userData.role === ROLES.TUTOR ? [] : undefined,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    profilePicture: userData.profilePicture || '',
    bio: userData.bio || ''
  };

  users.push(newUser);
  saveUsers(users);
  
  // Return the user without the password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// Get user by ID
const getUserById = (userId) => {
  const users = getUsers();
  const user = users.find(user => user.id === userId);
  
  if (!user) return null;
  
  // Return the user without the password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Get user by email
const getUserByEmail = (email) => {
  const users = getUsers();
  return users.find(user => user.email === email);
};

// Update user
const updateUser = (userId, updates) => {
  const users = getUsers();
  const index = users.findIndex(user => user.id === userId);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  saveUsers(users);
  
  // Return the user without the password
  const { password, ...userWithoutPassword } = users[index];
  return userWithoutPassword;
};

// Verify user's email
const verifyUser = (token) => {
  const users = getUsers();
  const index = users.findIndex(user => user.verificationToken === token);
  
  if (index === -1) {
    throw new Error('Invalid verification token');
  }
  
  users[index].verified = true;
  users[index].verificationToken = null;
  users[index].updatedAt = new Date().toISOString();
  
  saveUsers(users);
  
  // Return the user without the password
  const { password, ...userWithoutPassword } = users[index];
  return userWithoutPassword;
};

// Add pupil to tutor
const addPupilToTutor = (tutorId, pupilId) => {
  const users = getUsers();
  const tutorIndex = users.findIndex(user => user.id === tutorId && user.role === ROLES.TUTOR);
  const pupilIndex = users.findIndex(user => user.id === pupilId && user.role === ROLES.PUPIL);
  
  if (tutorIndex === -1) {
    throw new Error('Tutor not found');
  }
  
  if (pupilIndex === -1) {
    throw new Error('Pupil not found');
  }
  
  // Add pupil to tutor's list if not already added
  if (!users[tutorIndex].pupils.includes(pupilId)) {
    users[tutorIndex].pupils.push(pupilId);
  }
  
  // Link pupil to tutor
  users[pupilIndex].tutorId = tutorId;
  
  saveUsers(users);
};

// Create access code for inviting pupils
const createAccessCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Validate access code
const validateAccessCode = (accessCode) => {
  const users = getUsers();
  return users.some(user => 
    (user.role === ROLES.TUTOR || user.role === ROLES.ADMIN) && 
    user.accessCodes && 
    user.accessCodes.includes(accessCode)
  );
};

// Authenticate user
const authenticateUser = async (email, password) => {
  const user = getUserByEmail(email);
  
  if (!user) {
    return null;
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    return null;
  }
  
  // Return the user without the password
  const { password: pwd, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Update user profile
const updateProfile = (userId, profileData) => {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Update profile fields
  users[userIndex] = {
    ...users[userIndex],
    bio: profileData.bio || users[userIndex].bio || '',
    interests: profileData.interests || users[userIndex].interests || '',
    experience: profileData.experience || users[userIndex].experience || '',
    profilePicture: profileData.profilePicture || users[userIndex].profilePicture || '',
    updatedAt: new Date().toISOString()
  };
  
  saveUsers(users);
  return users[userIndex];
};

module.exports = {
  ROLES,
  getUsers,
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  verifyUser,
  addPupilToTutor,
  createAccessCode,
  validateAccessCode,
  authenticateUser,
  updateProfile
}; 