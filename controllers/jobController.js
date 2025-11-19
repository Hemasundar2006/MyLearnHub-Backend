const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

const buildPublicJobFilters = ({ search, jobType, workMode, location, featured, minExperience, tags, applicationProcess }) => {
  const query = {
    isActive: true,
  };

  const today = new Date();
  query.$or = [
    { lastDateToApply: { $gte: today } },
    { lastDateToApply: { $exists: false } },
    { lastDateToApply: null },
  ];

  if (search) {
    query.$text = { $search: search };
  }

  if (jobType) {
    query.jobType = new RegExp(`^${jobType}$`, 'i');
  }

  if (workMode) {
    query.workMode = new RegExp(`^${workMode}$`, 'i');
  }

  if (location) {
    query.location = new RegExp(location, 'i');
  }

  if (featured) {
    query.isFeatured = featured === 'true' || featured === true;
  }

  if (minExperience) {
    query.experienceMinYears = { $lte: parseInt(minExperience, 10) };
  }

  if (tags) {
    const tagList = Array.isArray(tags) ? tags : tags.split(',');
    query.tags = { $in: tagList.map((tag) => tag.trim()).filter(Boolean) };
  }

  if (applicationProcess) {
    query.applicationProcess = applicationProcess;
  }

  return query;
};

// @desc    List public jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filters = buildPublicJobFilters(req.query);

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [jobs, total] = await Promise.all([
      Job.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-metadata'),
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
    console.error('Public get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching jobs',
      error: error.message,
    });
  }
};

// @desc    Get single public job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      isActive: true,
    }).select('-metadata');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    job.views += 1;
    await job.save();

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Public get job by id error:', error);
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

// @desc    Apply to a job
// @route   POST /api/jobs/:jobId/apply
// @access  Private (user)
exports.applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      resumeUrl,
      coverLetter,
      portfolioUrl,
      answers,
      fullName,
      email,
      phone,
      applyMode,
    } = req.body;

    const job = await Job.findById(jobId);

    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.lastDateToApply && job.lastDateToApply < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Application window has closed for this job',
      });
    }

    const requestedMode = ['internal', 'external'].includes(applyMode)
      ? applyMode
      : undefined;

    let effectiveMode = job.applicationProcess || 'external';
    if (job.applicationProcess === 'both') {
      effectiveMode = requestedMode || (resumeUrl ? 'internal' : 'external');
    }

    const supportsExternal = job.applicationLink && job.applicationProcess !== 'internal';
    if (effectiveMode === 'external' && !supportsExternal) {
      effectiveMode = 'internal';
    }

    if (effectiveMode === 'external' && !job.applicationLink) {
      return res.status(400).json({
        success: false,
        message: 'External application link is not configured for this job',
      });
    }

    if (effectiveMode === 'internal' && !resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Resume URL is required for this job',
      });
    }

    const existingApplication = await JobApplication.findOne({
      job: jobId,
      applicant: req.user.id,
    });

    await Job.findByIdAndUpdate(jobId, {
      $inc: { applyClicks: 1 },
    });

    if (existingApplication) {
      return res.status(200).json({
        success: true,
        message: 'You have already applied to this job',
        application: existingApplication,
        redirectUrl: effectiveMode === 'external' ? job.applicationLink : undefined,
        external: effectiveMode === 'external',
      });
    }

    const application = await JobApplication.create({
      job: jobId,
      applicant: req.user.id,
      resumeUrl: effectiveMode === 'external' ? undefined : resumeUrl,
      coverLetter,
      portfolioUrl,
      answers,
      fullName: fullName || req.user.name,
      email: email || req.user.email,
      phone,
      applicationType: effectiveMode === 'external' ? 'external' : 'internal',
      redirectUrl: effectiveMode === 'external' ? job.applicationLink : undefined,
      status: effectiveMode === 'external' ? 'reviewing' : 'pending',
    });

    await Job.findByIdAndUpdate(jobId, {
      $inc: { totalApplications: 1 },
    });

    res.status(201).json({
      success: true,
      application,
      redirectUrl: effectiveMode === 'external' ? job.applicationLink : undefined,
      external: effectiveMode === 'external',
      message: effectiveMode === 'external'
        ? 'Application tracked. Redirect user to the external link.'
        : 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Apply to job error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error submitting application',
      error: error.message,
    });
  }
};

// @desc    Get current user job applications
// @route   GET /api/jobs/applications/me
// @access  Private (user)
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find({ applicant: req.user.id })
      .sort('-createdAt')
      .populate('job', 'title companyName jobType location workMode isActive');

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Get my job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching applications',
      error: error.message,
    });
  }
};


