const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Path to the messages data file
const dataPath = path.join(__dirname, '../data/messages.json');

// Initialize messages data file if it doesn't exist
const initMessagesData = () => {
  if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  }
  
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
  }
};

// Get all messages
const getMessages = () => {
  initMessagesData(); // Ensure the messages file exists
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading messages file:', error);
    return [];
  }
};

// Save messages to file
const saveMessages = (messages) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(messages, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving messages:', error);
    throw new Error('Failed to save messages');
  }
};

// Create a new message
const createMessage = (messageData) => {
  const messages = getMessages();
  
  const newMessage = {
    id: uuidv4(),
    senderId: messageData.senderId,
    receiverId: messageData.receiverId,
    content: messageData.content,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  messages.push(newMessage);
  saveMessages(messages);
  
  return newMessage;
};

// Get messages between two users
const getMessagesBetweenUsers = (userId1, userId2) => {
  const messages = getMessages();
  return messages.filter(
    message => 
      (message.senderId === userId1 && message.receiverId === userId2) ||
      (message.senderId === userId2 && message.receiverId === userId1)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// Get unread messages for a user
const getUnreadMessagesForUser = (userId) => {
  const messages = getMessages();
  return messages.filter(
    message => message.receiverId === userId && !message.read
  );
};

// Mark message as read
const markMessageAsRead = (messageId) => {
  const messages = getMessages();
  const index = messages.findIndex(message => message.id === messageId);
  
  if (index === -1) {
    throw new Error('Message not found');
  }
  
  messages[index].read = true;
  saveMessages(messages);
  
  return messages[index];
};

// Mark all messages between users as read
const markAllMessagesAsRead = (receiverId, senderId) => {
  const messages = getMessages();
  const updatedMessages = messages.map(message => {
    if (message.receiverId === receiverId && message.senderId === senderId && !message.read) {
      return { ...message, read: true };
    }
    return message;
  });
  
  saveMessages(updatedMessages);
};

// Delete a message
const deleteMessage = (messageId) => {
  const messages = getMessages();
  const index = messages.findIndex(message => message.id === messageId);
  
  if (index === -1) {
    throw new Error('Message not found');
  }
  
  messages.splice(index, 1);
  saveMessages(messages);
};

module.exports = {
  createMessage,
  getMessages,
  getMessagesBetweenUsers,
  getUnreadMessagesForUser,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteMessage
}; 