const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'closed', 'timeout'],
      default: 'pending',
      index: true,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    totalTimeInMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCoinsSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastBillingTime: {
      type: Date,
      default: null,
    },
    requestedDuration: {
      type: Number,
      default: null,
      min: 1,
      max: 30,
    },
    requestedCoins: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total time and coins before saving (when closing)
chatSessionSchema.pre('save', function (next) {
  if (this.status === 'closed' || this.status === 'timeout') {
    if (this.startTime && this.endTime) {
      const timeDiff = this.endTime - this.startTime;
      this.totalTimeInMinutes = Math.ceil(timeDiff / (1000 * 60)); // Convert to minutes, round up
    }
  }
  next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);


