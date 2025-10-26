const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    notifications: {
      email: {
        enabled: { type: Boolean, default: true },
        courseUpdates: { type: Boolean, default: true },
        newContent: { type: Boolean, default: true },
        systemAlerts: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
      },
      push: {
        enabled: { type: Boolean, default: true },
        courseReminders: { type: Boolean, default: true },
        assignments: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
      },
      sms: {
        enabled: { type: Boolean, default: false },
        urgentOnly: { type: Boolean, default: true },
      },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'students', 'private'],
        default: 'students',
      },
      showEnrollments: { type: Boolean, default: true },
      showProgress: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false },
    },
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      darkMode: { type: Boolean, default: false },
      autoBackup: { type: Boolean, default: true },
      emailDigest: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'never'],
        default: 'weekly',
      },
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      loginAlerts: { type: Boolean, default: true },
      sessionTimeout: { type: Number, default: 30 }, // minutes
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);

