const User = require('../models/User');
const config = require('../config/config');

// Create admin user if none exists
const setupAdmin = async () => {
  try {
    const users = User.getUsers();
    const adminExists = users.some(user => user.role === User.ROLES.ADMIN);
    
    if (!adminExists) {
      console.log('No admin user found. Creating default admin...');
      
      await User.createUser({
        email: config.admin.email,
        password: config.admin.password,
        role: User.ROLES.ADMIN,
        verified: true,
        firstName: 'Admin',
        lastName: 'User'
      });
      
      console.log(`Admin user created with email: ${config.admin.email}`);
    }
  } catch (error) {
    console.error('Error setting up admin user:', error);
  }
};

module.exports = { setupAdmin }; 