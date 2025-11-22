// Socket.IO service to provide access to io instance
let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

const emitToAdmins = (event, data) => {
  if (!ioInstance) return;
  
  // Get all admin socket IDs from activeConnections
  const { activeConnections } = require('../socket/chatHandler');
  activeConnections.admins.forEach((adminSocketId) => {
    ioInstance.to(adminSocketId).emit(event, data);
  });
};

const emitToUser = (userId, event, data) => {
  if (!ioInstance) return;
  
  const { activeConnections } = require('../socket/chatHandler');
  const userSocketId = activeConnections.users.get(userId);
  if (userSocketId) {
    ioInstance.to(userSocketId).emit(event, data);
  }
};

const emitToAdmin = (adminId, event, data) => {
  if (!ioInstance) return;
  
  const { activeConnections } = require('../socket/chatHandler');
  const adminSocketId = activeConnections.admins.get(adminId);
  if (adminSocketId) {
    ioInstance.to(adminSocketId).emit(event, data);
  }
};

module.exports = {
  setIO,
  getIO,
  emitToAdmins,
  emitToUser,
  emitToAdmin,
};


