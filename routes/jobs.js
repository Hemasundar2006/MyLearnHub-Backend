const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const {
  getJobs,
  getJobById,
  applyToJob,
  getMyApplications,
} = require('../controllers/jobController');

router.get('/', getJobs);

router.get('/applications/me', protect, getMyApplications);
router.post('/:jobId/apply', protect, applyToJob);

router.get('/:id', getJobById);

module.exports = router;


