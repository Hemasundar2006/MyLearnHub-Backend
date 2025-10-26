const Notification = require('../models/Notification');
const User = require('../models/User');

const seedNotifications = async () => {
  try {
    // Check if notifications already exist
    const existingNotifications = await Notification.countDocuments();
    if (existingNotifications > 0) {
      console.log('📢 Notifications already exist, skipping seed...');
      return;
    }

    // Get or create an admin user to send notifications
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️ No admin user found, cannot seed notifications');
      return;
    }

    // Get all users for targeting
    const allUsers = await User.find().select('_id');

    const sampleNotifications = [
      {
        title: 'Welcome to MyLearnHub!',
        message: 'Thank you for joining MyLearnHub. Start exploring our courses today!',
        type: 'system',
        targetAudience: 'all',
        targetUsers: allUsers.map(u => u._id),
        priority: 'high',
        status: 'sent',
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        sentBy: adminUser._id,
        icon: '👋',
      },
      {
        title: 'New Course Available: AP EAPCET 2026 Test Series',
        message: 'AP EAPCET 2026 Test Series is now available. Enroll now to start your preparation!',
        type: 'course',
        targetAudience: 'all',
        targetUsers: allUsers.map(u => u._id),
        priority: 'medium',
        status: 'sent',
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        sentBy: adminUser._id,
        icon: '📚',
        link: '/courses',
      },
      {
        title: 'Exam Reminder',
        message: 'Your AP EAPCET exam is coming up soon. Make sure you complete all practice tests.',
        type: 'announcement',
        targetAudience: 'students',
        targetUsers: allUsers.map(u => u._id),
        priority: 'urgent',
        status: 'sent',
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        sentBy: adminUser._id,
        icon: '⏰',
      },
      {
        title: 'New Study Material Added',
        message: 'New study material has been added to Physics Chapter 5. Check it out now!',
        type: 'course',
        targetAudience: 'all',
        targetUsers: allUsers.map(u => u._id),
        priority: 'low',
        status: 'sent',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        sentBy: adminUser._id,
        icon: '📖',
      },
      {
        title: 'System Maintenance Scheduled',
        message: 'System maintenance is scheduled for this weekend. The platform may be unavailable for 2 hours.',
        type: 'system',
        targetAudience: 'all',
        targetUsers: allUsers.map(u => u._id),
        priority: 'high',
        status: 'sent',
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        sentBy: adminUser._id,
        icon: '🔧',
      },
      {
        title: 'Congratulations on Your Progress!',
        message: 'You have completed 50% of your enrolled courses. Keep up the great work!',
        type: 'general',
        targetAudience: 'all',
        targetUsers: allUsers.map(u => u._id),
        priority: 'low',
        status: 'sent',
        sentAt: new Date(), // Just now
        sentBy: adminUser._id,
        icon: '🎉',
      },
    ];

    await Notification.insertMany(sampleNotifications);
    console.log('✅ Sample notifications seeded successfully!');
    console.log(`📢 Created ${sampleNotifications.length} notifications`);
  } catch (error) {
    console.error('❌ Error seeding notifications:', error.message);
  }
};

module.exports = seedNotifications;

