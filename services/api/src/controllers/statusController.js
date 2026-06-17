const { createJobService } = require('../services/jobService');

async function getJobStatus(req, res, next) {
  try {
    const jobService = createJobService();
    const job = await jobService.getJobStatus(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json(job);
  } catch (error) {
    return next(error);
  }
}

module.exports = { getJobStatus };
