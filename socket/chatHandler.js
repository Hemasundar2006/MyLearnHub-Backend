const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Store active connections
const activeConnections = {
  users: new Map(), // userId -> socketId
  admins: new Map(), // adminId -> socketId
};

// Helper function to authenticate socket connection
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find user first
    const user = await User.findById(decoded.id);
    if (user) {
      socket.userId = user._id.toString();
      socket.userType = 'user';
      return next();
    }

    // Try to find admin
    const admin = await Admin.findById(decoded.id);
    if (admin) {
      socket.adminId = admin._id.toString();
      socket.userType = 'admin';
      return next();
    }

    return next(new Error('Authentication error: User or Admin not found'));
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
};

// Initialize Socket.IO chat handler
const initializeChatHandler = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, Type: ${socket.userType}, ID: ${socket.userId || socket.adminId}`);

    // Store connection
    if (socket.userType === 'user' && socket.userId) {
      activeConnections.users.set(socket.userId, socket.id);
    } else if (socket.userType === 'admin' && socket.adminId) {
      activeConnections.admins.set(socket.adminId, socket.id);
    }

    // Handle chat request (user initiates)
    socket.on('chatRequest', async (data) => {
      try {
        if (socket.userType !== 'user') {
          return socket.emit('error', { message: 'Only users can request chats' });
        }

        const session = await ChatSession.findById(data.sessionId)
          .populate('userId', 'name email');

        if (!session || session.userId._id.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Invalid session' });
        }

        // Notify all online admins
        activeConnections.admins.forEach((adminSocketId) => {
          io.to(adminSocketId).emit('chatRequest', {
            sessionId: session._id,
            userId: session.userId._id,
            userName: session.userId.name,
            userEmail: session.userId.email,
            createdAt: session.createdAt,
          });
        });
      } catch (error) {
        console.error('Chat request error:', error);
        socket.emit('error', { message: 'Error processing chat request' });
      }
    });

    // Handle chat started (admin accepts)
    socket.on('chatStarted', async (data) => {
      try {
        if (socket.userType !== 'admin') {
          return socket.emit('error', { message: 'Only admins can start chats' });
        }

        const session = await ChatSession.findById(data.sessionId)
          .populate('userId', 'name email')
          .populate('adminId', 'adminName');

        if (!session || session.adminId._id.toString() !== socket.adminId) {
          return socket.emit('error', { message: 'Invalid session' });
        }

        // Notify user
        const userSocketId = activeConnections.users.get(session.userId._id.toString());
        if (userSocketId) {
          io.to(userSocketId).emit('chatStarted', {
            sessionId: session._id,
            adminId: session.adminId._id,
            adminName: session.adminId.adminName,
            startTime: session.startTime,
          });
        }

        // Notify admin
        socket.emit('chatStarted', {
          sessionId: session._id,
          userId: session.userId._id,
          userName: session.userId.name,
          startTime: session.startTime,
        });
      } catch (error) {
        console.error('Chat started error:', error);
        socket.emit('error', { message: 'Error starting chat' });
      }
    });

    // Handle send message
    socket.on('sendMessage', async (data) => {
      try {
        const { sessionId, message } = data;

        if (!sessionId || !message) {
          return socket.emit('error', { message: 'Session ID and message are required' });
        }

        // Find session
        const session = await ChatSession.findById(sessionId);

        if (!session) {
          return socket.emit('error', { message: 'Chat session not found' });
        }

        // Verify authorization
        if (socket.userType === 'user') {
          if (session.userId.toString() !== socket.userId) {
            return socket.emit('error', { message: 'Not authorized' });
          }
        } else if (socket.userType === 'admin') {
          if (!session.adminId || session.adminId.toString() !== socket.adminId) {
            return socket.emit('error', { message: 'Not authorized' });
          }
        }

        // Check if session is active
        if (session.status !== 'active') {
          return socket.emit('error', { message: 'Chat session is not active' });
        }

        // Save message
        const chatMessage = await ChatMessage.create({
          sessionId,
          senderId: socket.userId || socket.adminId,
          senderType: socket.userType,
          message,
        });

        // Determine recipient socket
        let recipientSocketId = null;
        if (socket.userType === 'user') {
          // User sent message, notify admin
          if (session.adminId) {
            recipientSocketId = activeConnections.admins.get(session.adminId.toString());
          }
        } else {
          // Admin sent message, notify user
          recipientSocketId = activeConnections.users.get(session.userId.toString());
        }

        // Emit message to sender
        socket.emit('messageReceived', {
          sessionId,
          message: chatMessage,
        });

        // Emit message to recipient
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('messageReceived', {
            sessionId,
            message: chatMessage,
          });
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle chat ended
    socket.on('chatEnded', async (data) => {
      try {
        const { sessionId } = data;

        const session = await ChatSession.findById(sessionId)
          .populate('userId', 'name email')
          .populate('adminId', 'adminName');

        if (!session) {
          return socket.emit('error', { message: 'Chat session not found' });
        }

        // Notify both parties
        const userSocketId = activeConnections.users.get(session.userId._id.toString());
        const adminSocketId = session.adminId
          ? activeConnections.admins.get(session.adminId._id.toString())
          : null;

        const endData = {
          sessionId: session._id,
          status: session.status,
          totalTimeInMinutes: session.totalTimeInMinutes,
          totalCoinsSpent: session.totalCoinsSpent,
          endTime: session.endTime,
        };

        if (userSocketId) {
          io.to(userSocketId).emit('chatEnded', endData);
        }

        if (adminSocketId) {
          io.to(adminSocketId).emit('chatEnded', endData);
        }
      } catch (error) {
        console.error('Chat ended error:', error);
        socket.emit('error', { message: 'Error ending chat' });
      }
    });

    // Handle coin update
    socket.on('coinUpdate', (data) => {
      const { userId, coins } = data;
      const userSocketId = activeConnections.users.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit('coinUpdate', { coins });
      }
    });

    // Handle chat timeout
    socket.on('chatTimeout', (data) => {
      const { sessionId, userId } = data;
      const userSocketId = activeConnections.users.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit('chatTimeout', {
          sessionId,
          message: 'Chat session ended due to insufficient coins',
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Remove from active connections
      if (socket.userType === 'user' && socket.userId) {
        activeConnections.users.delete(socket.userId);
      } else if (socket.userType === 'admin' && socket.adminId) {
        activeConnections.admins.delete(socket.adminId);
      }
    });
  });

  return io;
};

module.exports = { initializeChatHandler, activeConnections };


