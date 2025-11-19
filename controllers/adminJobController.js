const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

const buildJobFilters = ({ search, jobType, workMode, isActive, isFeatured, startDate, endDate, applicationProcess }) => {
  const query = {};
  if (applicationProcess) {
    query.applicationProcess = applicationProcess;
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (jobType) {
    query.jobType = new RegExp(`^${jobType}$`, 'i');
  }

  if (workMode) {
    query.workMode = new RegExp(`^${workMode}$`, 'i');
  }

  if (typeof isActive !== 'undefined') {
    query.isActive = isActive === 'true' || isActive === true;
  }

  if (typeof isFeatured !== 'undefined') {
    query.isFeatured = isFeatured === 'true' || isFeatured === true;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  return query;
};

// @desc    Get all job posts (admin)
// @route   GET /api/admin/jobs
// @access  Private/Admin
exports.getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filters = buildJobFilters(req.query);

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [jobs, total] = await Promise.all([
      Job.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('createdBy', 'name email'),
      Job.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      jobs,
    });
  } catch (error) {
    console.error('Admin get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching jobs',
      error: error.message,
    });
  }
};

// @desc    Create a job post
// @route   POST /api/admin/jobs
// @access  Private/Admin
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      companyName,
      jobType,
      location,
      workMode,
      experienceMinYears,
      experienceMaxYears,
      jobDescription,
      eligibility,
      jobSpecification,
      applicationLink,
      applicationProcess,
      youtubeLink,
      startDate,
      lastDateToApply,
      salary,
      companyLogoUrl,
      feeStructure,
      metaTitle,
      pdfLink,
      metaDescription,
      tags,
      isFeatured,
      isActive,
      metadata,
    } = req.body;

    if (!title || !companyName || !jobDescription || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, company name, job description, and location',
      });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : undefined;

    const job = await Job.create({
      title,
      companyName,
      jobType,
      location,
      workMode,
      experienceMinYears,
      experienceMaxYears,
      jobDescription,
      eligibility,
      jobSpecification,
      applicationLink,
      applicationProcess,
      youtubeLink,
      startDate,
      lastDateToApply,
      salary,
      companyLogoUrl,
      feeStructure,
      metaTitle,
      pdfLink,
      metaDescription,
      tags: normalizedTags,
      isFeatured,
      isActive,
      metadata,
      createdBy: req.user.id,
    });

    const populatedJob = await Job.findById(job._id).populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      job: populatedJob,
      message: 'Job created successfully',
    });
  } catch (error) {
    console.error('Admin create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating job',
      error: error.message,
    });
  }
};

// @desc    Get single job (admin)
// @route   GET /api/admin/jobs/:id
// @access  Private/Admin
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Admin get job by id error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching job',
      error: error.message,
    });
  }
};

// @desc    Update job
// @route   PUT /api/admin/jobs/:id
// @access  Private/Admin
exports.updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const updateBody = { ...req.body };
    if (typeof updateBody.tags === 'string') {
      updateBody.tags = updateBody.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    }

    job = await Job.findByIdAndUpdate(req.params.id, updateBody, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      job,
      message: 'Job updated successfully',
    });
  } catch (error) {
    console.error('Admin update job error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating job',
      error: error.message,
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/admin/jobs/:id
// @access  Private/Admin
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    await Promise.all([
      JobApplication.deleteMany({ job: job._id }),
      job.deleteOne(),
    ]);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete job error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting job',
      error: error.message,
    });
  }
};

// @desc    Get job applications for a job
// @route   GET /api/admin/jobs/:jobId/applications
// @access  Private/Admin
exports.getJobApplications = async (req, res) => {
  try {
    const { status } = req.query;

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const query = { job: req.params.jobId };
    if (status) {
      query.status = status;
    }

    const applications = await JobApplication.find(query)
      .sort('-createdAt')
      .populate('applicant', 'name email phone');

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Admin get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching applications',
      error: error.message,
    });
  }
};

// @desc    Get all applications with filters
// @route   GET /api/admin/jobs/applications
// @access  Private/Admin
exports.getAllApplications = async (req, res) => {
  try {
    const { status, jobId, applicantId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (jobId) query.job = jobId;
    if (applicantId) query.applicant = applicantId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [applications, total] = await Promise.all([
      JobApplication.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('job', 'title companyName')
        .populate('applicant', 'name email'),
      JobApplication.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      applications,
    });
  } catch (error) {
    console.error('Admin get all applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching applications',
      error: error.message,
    });
  }
};

// @desc    Update application status
// @route   PUT /api/admin/jobs/applications/:applicationId/status
// @access  Private/Admin
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status',
      });
    }

    const application = await JobApplication.findById(req.params.applicationId)
      .populate('job', 'title')
      .populate('applicant', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    application.status = status;
    if (typeof notes !== 'undefined') {
      application.notes = notes;
    }
    await application.save();

    res.status(200).json({
      success: true,
      application,
      message: 'Application status updated',
    });
  } catch (error) {
    console.error('Admin update application status error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating application status',
      error: error.message,
    });
  }
};


