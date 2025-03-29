const User = require('../models/User');
const AccessCode = require('../models/AccessCode');
const { sendAccessCodeEmail } = require('../utils/email');
const path = require('path');
const fs = require('fs');

// Get all users (admin only)
const getAllUsers = (req, res) => {
  try {
    const users = User.getUsers();
    
    // Remove passwords from the response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.status(200).json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
const getUserById = (req, res) => {
  try {
    const { userId } = req.params;
    const user = User.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user
const updateUser = (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Prevent updating critical fields
    delete updates.password;
    delete updates.role;
    delete updates.email;
    delete updates.verified;
    
    const updatedUser = User.updateUser(userId, updates);
    
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get pupils for tutor
const getPupilsForTutor = (req, res) => {
  try {
    const tutorId = req.session.userId || req.user.id;
    const tutor = User.getUserById(tutorId);
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    if (tutor.role !== User.ROLES.TUTOR && tutor.role !== User.ROLES.ADMIN) {
      return res.status(403).json({ message: 'You must be a tutor to access pupils' });
    }
    
    const pupils = [];
    if (tutor.pupils && tutor.pupils.length > 0) {
      // Get details for each pupil
      for (const pupilId of tutor.pupils) {
        const pupil = User.getUserById(pupilId);
        if (pupil) pupils.push(pupil);
      }
    }
    
    res.status(200).json({ pupils });
  } catch (error) {
    console.error('Get pupils error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get tutor for pupil
const getTutorForPupil = (req, res) => {
  try {
    const pupilId = req.user.id;
    const pupil = User.getUserById(pupilId);
    
    if (!pupil) {
      return res.status(404).json({ message: 'Pupil not found' });
    }
    
    if (pupil.role !== User.ROLES.PUPIL) {
      return res.status(403).json({ message: 'You must be a pupil to access your tutor' });
    }
    
    if (!pupil.tutorId) {
      return res.status(404).json({ message: 'No tutor assigned' });
    }
    
    const tutor = User.getUserById(pupil.tutorId);
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Remove sensitive information before sending
    const { password, verificationToken, ...tutorInfo } = tutor;
    
    res.status(200).json({ tutor: tutorInfo });
  } catch (error) {
    console.error('Get tutor error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create access code for new user
const createAccessCodeForUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    const creatorId = req.session.userId || req.user.id;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Validate role
    const validRoles = [User.ROLES.PUPIL, User.ROLES.TUTOR];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }
    
    // Only admin can create tutor access codes
    const creator = User.getUserById(creatorId);
    if (role === User.ROLES.TUTOR && creator.role !== User.ROLES.ADMIN) {
      return res.status(403).json({ 
        message: 'Only administrators can create access codes for tutors' 
      });
    }
    
    // Create access code
    const accessCode = AccessCode.createAccessCode(
      creatorId, 
      role || User.ROLES.PUPIL
    );
    
    // Send email with access code
    if (email) {
      await sendAccessCodeEmail(
        email, 
        accessCode.code, 
        `${creator.firstName} ${creator.lastName}`.trim() || creator.email
      );
    }
    
    res.status(201).json({
      message: 'Access code created successfully',
      accessCode
    });
  } catch (error) {
    console.error('Create access code error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get access codes created by current user
const getMyAccessCodes = (req, res) => {
  try {
    const userId = req.session.userId || req.user.id;
    const accessCodes = AccessCode.getAccessCodesByCreator(userId);
    
    res.status(200).json({ accessCodes });
  } catch (error) {
    console.error('Get access codes error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;  // Get ID from JWT token
    const { bio, interests } = req.body;
    let profilePicture = '';

    // Handle profile picture upload if present
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture;
      const fileName = `${userId}-${Date.now()}${path.extname(file.name)}`;
      const uploadPath = path.join(__dirname, '../public/uploads/profiles', fileName);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../public/uploads/profiles');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Move the file
      await file.mv(uploadPath);
      profilePicture = `/uploads/profiles/${fileName}`;
    }

    // Get the current user to check their role
    const currentUser = User.getUserById(userId);
    
    // Create update object
    const updates = {
      bio,
      interests,
      ...(profilePicture && { profilePicture })
    };

    // Only include experience for tutors
    if (currentUser.role === User.ROLES.TUTOR && req.body.experience) {
      updates.experience = req.body.experience;
    }

    // Update user profile
    const updatedUser = User.updateProfile(userId, updates);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  getPupilsForTutor,
  getTutorForPupil,
  createAccessCodeForUser,
  getMyAccessCodes,
  updateProfile
}; 