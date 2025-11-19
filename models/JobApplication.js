const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    resumeUrl: String,
    coverLetter: String,
    portfolioUrl: String,
    answers: [
      {
        question: String,
        response: String,
      },
    ],
    applicationType: {
      type: String,
      enum: ['internal', 'external'],
      default: 'internal',
    },
    redirectUrl: String,
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'],
      default: 'pending',
    },
    notes: String,
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);


