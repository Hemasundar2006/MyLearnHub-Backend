const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      trim: true,
    },
    amount: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
  },
  { _id: false }
);

const salarySchema = new mongoose.Schema(
  {
    display: {
      type: String,
      trim: true,
    },
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    payType: {
      type: String,
      enum: ['yearly', 'monthly', 'weekly', 'daily', 'hourly', 'other'],
      default: 'monthly',
    },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    jobType: {
      type: String,
      trim: true,
      default: 'Full Time',
    },
    location: {
      type: String,
      required: [true, 'Please provide a job location'],
      trim: true,
    },
    workMode: {
      type: String,
      trim: true,
      default: 'Work From Office',
    },
    experienceMinYears: {
      type: Number,
      min: 0,
    },
    experienceMaxYears: {
      type: Number,
      min: 0,
    },
    jobDescription: {
      type: String,
      required: [true, 'Please provide a job description'],
    },
    eligibility: String,
    jobSpecification: String,
    applicationLink: String,
    applicationProcess: {
      type: String,
      enum: ['internal', 'external', 'both'],
      default: 'external',
    },
    youtubeLink: String,
    startDate: Date,
    lastDateToApply: Date,
    salary: salarySchema,
    companyLogoUrl: String,
    feeStructure: [feeStructureSchema],
    metaTitle: String,
    pdfLink: String,
    metaDescription: String,
    tags: [String],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    applyClicks: {
      type: Number,
      default: 0,
    },
    totalApplications: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ title: 'text', companyName: 'text', location: 'text' });

module.exports = mongoose.model('Job', jobSchema);


