const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
const sendMessage = (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.session.userId || req.user.id;
    
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }
    
    // Check if sender exists
    const sender = User.getUserById(senderId);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }
    
    // Check if receiver exists
    const receiver = User.getUserById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Validate if the sender can message the receiver
    // Admin can message anyone
    if (sender.role === User.ROLES.ADMIN) {
      // Allowed
    } 
    // Tutor can message their pupils
    else if (sender.role === User.ROLES.TUTOR) {
      if (!sender.pupils.includes(receiverId)) {
        return res.status(403).json({ message: 'You can only message your pupils' });
      }
    } 
    // Pupil can message their tutor
    else if (sender.role === User.ROLES.PUPIL) {
      if (sender.tutorId !== receiverId) {
        return res.status(403).json({ message: 'You can only message your tutor' });
      }
    }
    
    // Create and save the message
    const newMessage = Message.createMessage({
      senderId,
      receiverId,
      content
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get conversation between two users
const getConversation = (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.session.userId || req.user.id;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if the target user exists
    const targetUser = User.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current user exists
    const currentUser = User.getUserById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    // Validate if the current user can view messages with the target user
    // Admin can view any conversation
    if (currentUser.role === User.ROLES.ADMIN) {
      // Allowed
    } 
    // Tutor can view conversations with their pupils
    else if (currentUser.role === User.ROLES.TUTOR) {
      if (!currentUser.pupils.includes(userId)) {
        return res.status(403).json({ message: 'You can only view conversations with your pupils' });
      }
    } 
    // Pupil can view conversations with their tutor
    else if (currentUser.role === User.ROLES.PUPIL) {
      if (currentUser.tutorId !== userId) {
        return res.status(403).json({ message: 'You can only view conversations with your tutor' });
      }
    }
    
    // Get the messages
    const messages = Message.getMessagesBetweenUsers(currentUserId, userId);
    
    // Mark messages from the other user as read
    Message.markAllMessagesAsRead(currentUserId, userId);
    
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations for the current user
const getConversations = async (req, res) => {
  try {
    const userId = req.session.userId || req.user.id;
    const currentUser = User.getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get potential conversation partners based on user role
    let potentialPartners = [];
    if (currentUser.role === 'pupil') {
      // Pupils can only message their tutor
      const tutor = User.getUserById(currentUser.tutorId);
      if (tutor) {
        potentialPartners = [tutor];
      }
    } else if (currentUser.role === 'tutor') {
      // Tutors can message their pupils
      potentialPartners = currentUser.pupils.map(pupilId => User.getUserById(pupilId)).filter(Boolean);
    } else if (currentUser.role === 'admin') {
      // Admins can message everyone
      potentialPartners = User.getAllUsers().filter(user => user.id !== userId);
    }

    // Get all messages involving the current user
    const allMessages = Message.getMessages();
    const userMessages = allMessages.filter(msg => 
      msg.senderId === userId || msg.receiverId === userId
    );

    // Build conversations data
    const conversations = potentialPartners.map(partner => {
      const messages = userMessages.filter(msg =>
        (msg.senderId === userId && msg.receiverId === partner.id) ||
        (msg.senderId === partner.id && msg.receiverId === userId)
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first

      const unreadCount = messages.filter(msg => 
        msg.senderId === partner.id && !msg.read
      ).length;

      return {
        otherUser: {
          id: partner.id,
          firstName: partner.firstName,
          lastName: partner.lastName,
          email: partner.email,
          role: partner.role,
          profilePicture: partner.profilePicture
        },
        lastMessage: messages[0] || null, // Most recent message or null if no messages
        unreadCount
      };
    });

    // Sort conversations by last message date (if exists)
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.status(200).json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get unread messages count
const getUnreadMessagesCount = (req, res) => {
  try {
    const userId = req.session.userId || req.user.id;
    
    // Get unread messages
    const unreadMessages = Message.getUnreadMessagesForUser(userId);
    
    // Group messages by sender
    const messagesCount = {};
    unreadMessages.forEach(message => {
      if (!messagesCount[message.senderId]) {
        messagesCount[message.senderId] = 0;
      }
      messagesCount[message.senderId]++;
    });
    
    res.status(200).json({
      total: unreadMessages.length,
      bySender: messagesCount
    });
  } catch (error) {
    console.error('Get unread messages count error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark message as read
const markMessageRead = (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.session.userId || req.user.id;
    
    if (!messageId) {
      return res.status(400).json({ message: 'Message ID is required' });
    }
    
    // Get the message
    const messages = Message.getMessages();
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Validate that the current user is the receiver
    if (message.receiverId !== userId) {
      return res.status(403).json({ message: 'You can only mark messages sent to you as read' });
    }
    
    // Mark as read
    const updatedMessage = Message.markMessageAsRead(messageId);
    
    res.status(200).json({
      message: 'Message marked as read',
      data: updatedMessage
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete message
const deleteMessage = (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.session.userId || req.user.id;
    
    if (!messageId) {
      return res.status(400).json({ message: 'Message ID is required' });
    }
    
    // Get the message
    const messages = Message.getMessages();
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Validate that the current user is the sender or an admin
    const currentUser = User.getUserById(userId);
    if (message.senderId !== userId && currentUser.role !== User.ROLES.ADMIN) {
      return res.status(403).json({ message: 'You can only delete messages you sent' });
    }
    
    // Delete the message
    Message.deleteMessage(messageId);
    
    res.status(200).json({
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  getUnreadMessagesCount,
  markMessageRead,
  deleteMessage
}; 