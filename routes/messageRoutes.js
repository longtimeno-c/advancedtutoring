const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { isAuthenticated, isVerified, canMessageUser } = require('../middleware/auth');

// Get all conversations for the current user
router.get('/conversations', isAuthenticated, isVerified, messageController.getConversations);

// Send a message
router.post('/', isAuthenticated, isVerified, canMessageUser, messageController.sendMessage);

// Get conversation between two users
router.get('/conversation/:userId', isAuthenticated, isVerified, messageController.getConversation);

// Get unread messages count
router.get('/unread', isAuthenticated, isVerified, messageController.getUnreadMessagesCount);

// Mark message as read
router.put('/:messageId/read', isAuthenticated, isVerified, messageController.markMessageRead);

// Delete message
router.delete('/:messageId', isAuthenticated, isVerified, messageController.deleteMessage);

module.exports = router; 