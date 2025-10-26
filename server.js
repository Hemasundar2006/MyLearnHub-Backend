const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const seedCourses = require('./utils/seedCourses');
const seedNotifications = require('./utils/seedNotifications');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

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
      profile: '/api/profile',
      notifications: '/api/notifications',
      admin: {
        auth: '/api/admin/auth',
        dashboard: '/api/admin/dashboard',
        users: '/api/admin/users',
        courses: '/api/admin/courses',
        analytics: '/api/admin/analytics',
        notifications: '/api/admin/notifications',
        content: '/api/admin/content',
        settings: '/api/admin/settings',
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
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));

// Admin Routes
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/courses', require('./routes/admin/courses'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/analytics', require('./routes/admin/analytics'));
app.use('/api/admin/notifications', require('./routes/admin/notifications'));
app.use('/api/admin/content', require('./routes/admin/content'));
app.use('/api/admin/settings', require('./routes/admin/settings'));

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

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Server listening on port ${PORT}`);
  console.log(`🌍 API URL: http://localhost:${PORT}`);
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
  console.log('   Public Courses:');
  console.log('     - GET    /api/courses');
  console.log('     - GET    /api/courses/:id');
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
  console.log('   Admin Content:');
  console.log('     - GET    /api/admin/content');
  console.log('     - POST   /api/admin/content');
  console.log('   Admin Settings:');
  console.log('     - GET    /api/admin/settings');
  console.log('     - PUT    /api/admin/settings/:userId');
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

