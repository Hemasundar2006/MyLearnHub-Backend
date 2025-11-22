const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const seedCourses = require('./utils/seedCourses');
const seedNotifications = require('./utils/seedNotifications');
const { initializeChatHandler } = require('./socket/chatHandler');
const { startBillingService } = require('./services/billingService');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize chat handler
initializeChatHandler(io);

// Set io instance for socket service
const socketService = require('./services/socketService');
socketService.setIO(io);

// Start billing service
startBillingService(io);

// Connect to database and seed data
connectDB().then(() => {
  // Seed admin user and sample courses (for development)
  seedAdmin();
  if (process.env.NODE_ENV === 'development') {
    seedCourses();
    // Seed notifications after courses
    setTimeout(() => seedNotifications(), 2000);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MyLearnHub Backend API - Complete Platform',
    version: '3.0.0',
      endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      jobs: '/api/jobs',
      profile: '/api/profile',
      notifications: '/api/notifications',
      thoughts: '/api/thoughts',
      doubts: '/api/doubts',
      quizzes: '/api/quizzes',
      leaderboard: '/api/leaderboard',
      chat: '/api/chat',
      admin: {
        auth: '/api/admin/auth',
        dashboard: '/api/admin/dashboard',
        users: '/api/admin/users',
        courses: '/api/admin/courses',
        analytics: '/api/admin/analytics',
        notifications: '/api/admin/notifications',
        thoughts: '/api/admin/thoughts',
        content: '/api/admin/content',
        settings: '/api/admin/settings',
        doubts: '/api/admin/doubts',
        jobs: '/api/admin/jobs',
        chat: '/api/admin/chat',
      },
    },
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/thoughts', require('./routes/thoughts'));
app.use('/api/doubts', require('./routes/doubts'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/test', require('./routes/test'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/chat', require('./routes/chat'));

// Admin Routes
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/courses', require('./routes/admin/courses'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/analytics', require('./routes/admin/analytics'));
app.use('/api/admin/notifications', require('./routes/admin/notifications'));
app.use('/api/admin/thoughts', require('./routes/admin/thoughts'));
app.use('/api/admin/content', require('./routes/admin/content'));
app.use('/api/admin/settings', require('./routes/admin/settings'));
app.use('/api/admin/doubts', require('./routes/admin/doubts'));
app.use('/api/admin/rewards', require('./routes/admin/rewards'));
app.use('/api/admin/jobs', require('./routes/admin/jobs'));
app.use('/api/admin/quizzes', require('./routes/admin/quizzes'));
app.use('/api/admin/chat', require('./routes/admin/chat'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Server listening on port ${PORT}`);
  console.log(`🌍 API URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO enabled on port ${PORT}`);
  console.log('========================================');
  console.log('\n📚 API Endpoints:');
  console.log('   User Auth:');
  console.log('     - POST   /api/auth/register');
  console.log('     - POST   /api/auth/login');
  console.log('     - GET    /api/auth/profile');
  console.log('   User Profile:');
  console.log('     - GET    /api/profile');
  console.log('     - PUT    /api/profile');
  console.log('     - DELETE /api/profile');
  console.log('     - PUT    /api/profile/change-password');
  console.log('     - GET    /api/profile/enrollments');
  console.log('   User Notifications:');
  console.log('     - GET    /api/notifications');
  console.log('     - GET    /api/notifications/unread-count');
  console.log('     - POST   /api/notifications/:id/read');
  console.log('   User Thoughts:');
  console.log('     - POST   /api/thoughts');
  console.log('     - GET    /api/thoughts/my-thoughts');
  console.log('     - GET    /api/thoughts/my-stats');
  console.log('     - GET    /api/thoughts/coins');
  console.log('     - GET    /api/thoughts/coins/transactions');
  console.log('   Rewards:');
  console.log('     - GET    /api/rewards/dashboard');
  console.log('     - GET    /api/rewards/referrals');
  console.log('     - GET    /api/rewards/history');
  console.log('     - POST   /api/rewards/track');
  console.log('   User Doubts:');
  console.log('     - POST   /api/doubts');
  console.log('     - GET    /api/doubts/my-doubts');
  console.log('     - GET    /api/doubts/my-stats');
  console.log('     - DELETE /api/doubts/:id');
  console.log('     - GET    /api/doubts/leaderboard');
  console.log('   Public Courses:');
  console.log('     - GET    /api/courses');
  console.log('     - GET    /api/courses/:id');
  console.log('   Public Jobs:');
  console.log('     - GET    /api/jobs');
  console.log('     - GET    /api/jobs/:id');
  console.log('     - POST   /api/jobs/:jobId/apply');
  console.log('     - GET    /api/jobs/applications/me');
  console.log('   Admin Auth:');
  console.log('     - POST   /api/admin/auth/login');
  console.log('     - GET    /api/admin/auth/profile');
  console.log('   Admin Dashboard:');
  console.log('     - GET    /api/admin/dashboard/stats');
  console.log('     - GET    /api/admin/dashboard/activity');
  console.log('     - GET    /api/admin/dashboard/metrics');
  console.log('   Admin Users:');
  console.log('     - GET    /api/admin/users');
  console.log('     - GET    /api/admin/users/:id');
  console.log('     - PUT    /api/admin/users/:id');
  console.log('     - DELETE /api/admin/users/:id');
  console.log('   Admin Courses:');
  console.log('     - GET    /api/admin/courses');
  console.log('     - POST   /api/admin/courses');
  console.log('     - PUT    /api/admin/courses/:id');
  console.log('     - DELETE /api/admin/courses/:id');
  console.log('   Admin Analytics:');
  console.log('     - GET    /api/admin/analytics/overview');
  console.log('     - GET    /api/admin/analytics/revenue');
  console.log('     - GET    /api/admin/analytics/users');
  console.log('   Admin Notifications:');
  console.log('     - GET    /api/admin/notifications');
  console.log('     - POST   /api/admin/notifications');
  console.log('   Admin Thoughts:');
  console.log('     - GET    /api/admin/thoughts');
  console.log('     - POST   /api/admin/thoughts/:id/approve');
  console.log('     - POST   /api/admin/thoughts/:id/reject');
  console.log('   Admin Content:');
  console.log('     - GET    /api/admin/content');
  console.log('     - POST   /api/admin/content');
  console.log('   Admin Settings:');
  console.log('     - GET    /api/admin/settings');
  console.log('     - PUT    /api/admin/settings/:userId');
  console.log('   Admin Doubts:');
  console.log('     - GET    /api/admin/doubts');
  console.log('     - GET    /api/admin/doubts/stats');
  console.log('     - GET    /api/admin/doubts/leaderboard');
  console.log('     - POST   /api/admin/doubts/:id/answer');
  console.log('     - POST   /api/admin/doubts/:id/close');
  console.log('   Admin Rewards:');
  console.log('     - GET    /api/admin/rewards/overview');
  console.log('     - GET    /api/admin/rewards/users');
  console.log('     - GET    /api/admin/rewards/users/:userId');
  console.log('     - GET    /api/admin/rewards/referrals');
  console.log('   Admin Jobs:');
  console.log('     - GET    /api/admin/jobs');
  console.log('     - POST   /api/admin/jobs');
  console.log('     - GET    /api/admin/jobs/:id');
  console.log('     - PUT    /api/admin/jobs/:id');
  console.log('     - DELETE /api/admin/jobs/:id');
  console.log('     - GET    /api/admin/jobs/:jobId/applications');
  console.log('     - GET    /api/admin/jobs/applications');
  console.log('     - PUT    /api/admin/jobs/applications/:applicationId/status');
  console.log('   Chat System:');
  console.log('     - POST   /api/chat/request');
  console.log('     - POST   /api/chat/end/:sessionId');
  console.log('     - GET    /api/chat/sessions');
  console.log('     - GET    /api/chat/messages/:sessionId');
  console.log('   Admin Chat:');
  console.log('     - POST   /api/admin/chat/register');
  console.log('     - POST   /api/admin/chat/login');
  console.log('     - GET    /api/admin/chat/pending');
  console.log('     - POST   /api/admin/chat/accept/:sessionId');
  console.log('     - POST   /api/admin/chat/end/:sessionId');
  console.log('     - GET    /api/admin/chat/messages/:sessionId');
  console.log('========================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;

