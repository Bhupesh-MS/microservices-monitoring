const { createJobService } = require('../services/jobService');

async function submitJob(req, res, next) {
  try {
    const jobService = createJobService();
    const job = await jobService.submitJob(req.body || {});
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
}

module.exports = { submitJob };
