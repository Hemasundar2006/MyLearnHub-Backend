const Course = require('../models/Course');
const User = require('../models/User');
const sampleCourses = require('./sampleCourses');

// Seed sample courses (for development/testing only)
const seedCourses = async () => {
  try {
    // Check if courses already exist
    const coursesCount = await Course.countDocuments();

    if (coursesCount > 0) {
      console.log('Courses already exist in database');
      return;
    }

    // Find admin user to assign as creator
    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      console.log('⚠️  No admin user found. Please seed admin first.');
      return;
    }

    // Add admin as creator for all courses
    const coursesWithCreator = sampleCourses.map(course => ({
      ...course,
      createdBy: admin._id,
    }));

    // Insert sample courses
    const courses = await Course.insertMany(coursesWithCreator);

    console.log(`✅ ${courses.length} sample courses created successfully`);
  } catch (error) {
    console.error('Error seeding courses:', error.message);
  }
};

module.exports = seedCourses;

