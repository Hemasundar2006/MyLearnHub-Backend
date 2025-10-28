const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Please provide a question'],
      trim: true,
      maxlength: [1000, 'Question cannot exceed 1000 characters'],
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'answered', 'closed'],
      default: 'pending',
    },
    adminResponse: {
      title: {
        type: String,
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
      },
      url: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            if (!v) return true; // URL is optional
            return /^https?:\/\/.+/.test(v);
          },
          message: 'Please provide a valid URL'
        }
      },
      answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      answeredAt: {
        type: Date,
      },
    },
    coinsAwarded: {
      type: Number,
      default: 0,
    },
    isCoinsAwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
doubtSchema.index({ askedBy: 1, status: 1 });
doubtSchema.index({ status: 1, createdAt: -1 });
doubtSchema.index({ 'adminResponse.answeredBy': 1 });

module.exports = mongoose.model('Doubt', doubtSchema);
