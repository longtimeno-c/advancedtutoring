const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const User = require('./User');

// Path to the access codes data file
const dataPath = path.join(__dirname, '../data/accessCodes.json');

// Initialize access codes data file if it doesn't exist
const initAccessCodesData = () => {
  if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  }
  
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
  }
};

// Get all access codes
const getAccessCodes = () => {
  initAccessCodesData();
  const data = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(data);
};

// Save access codes to file
const saveAccessCodes = (accessCodes) => {
  fs.writeFileSync(dataPath, JSON.stringify(accessCodes, null, 2));
};

// Generate a random access code
const generateAccessCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create a new access code
const createAccessCode = (creatorId, role = User.ROLES.PUPIL) => {
  const accessCodes = getAccessCodes();
  
  // Generate a unique code
  let code;
  do {
    code = generateAccessCode();
  } while (accessCodes.some(ac => ac.code === code));
  
  const newAccessCode = {
    id: uuidv4(),
    code,
    creatorId,
    targetRole: role,
    used: false,
    usedBy: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
  };
  
  accessCodes.push(newAccessCode);
  saveAccessCodes(accessCodes);
  
  return newAccessCode;
};

// Validate an access code
const validateAccessCode = (code) => {
  const accessCodes = getAccessCodes();
  const accessCode = accessCodes.find(ac => ac.code === code);
  
  if (!accessCode) {
    return { valid: false, message: 'Invalid access code' };
  }
  
  if (accessCode.used) {
    return { valid: false, message: 'Access code has already been used' };
  }
  
  if (new Date(accessCode.expiresAt) < new Date()) {
    return { valid: false, message: 'Access code has expired' };
  }
  
  return { valid: true, accessCode };
};

// Mark an access code as used
const useAccessCode = (code, userId) => {
  const accessCodes = getAccessCodes();
  const index = accessCodes.findIndex(ac => ac.code === code);
  
  if (index === -1) {
    throw new Error('Invalid access code');
  }
  
  accessCodes[index].used = true;
  accessCodes[index].usedBy = userId;
  accessCodes[index].usedAt = new Date().toISOString();
  
  saveAccessCodes(accessCodes);
  
  return accessCodes[index];
};

// Get access codes created by a specific user
const getAccessCodesByCreator = (creatorId) => {
  const accessCodes = getAccessCodes();
  return accessCodes.filter(ac => ac.creatorId === creatorId);
};

// Get unused access codes
const getUnusedAccessCodes = () => {
  const accessCodes = getAccessCodes();
  return accessCodes.filter(ac => !ac.used && new Date(ac.expiresAt) > new Date());
};

module.exports = {
  createAccessCode,
  validateAccessCode,
  useAccessCode,
  getAccessCodesByCreator,
  getUnusedAccessCodes
}; 