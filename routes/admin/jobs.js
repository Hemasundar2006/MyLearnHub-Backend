const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/admin');
const {
  getJobs,
  createJob,
  getJobById,
  updateJob,
  deleteJob,
  getJobApplications,
  getAllApplications,
  updateApplicationStatus,
} = require('../../controllers/adminJobController');

router.use(protect);
router.use(adminOnly);

router.get('/applications', getAllApplications);
router.put('/applications/:applicationId/status', updateApplicationStatus);

router.route('/')
  .get(getJobs)
  .post(createJob);

router.get('/:jobId/applications', getJobApplications);

router.route('/:id')
  .get(getJobById)
  .put(updateJob)
  .delete(deleteJob);

module.exports = router;


