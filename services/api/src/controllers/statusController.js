const { createJobService } = require('../services/jobService');

/**
 * Handles job status lookup requests.
 *
 * @param {import('express').Request} req - Express request with `params.id`.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express error handler callback.
 * @returns {Promise<void>} Resolves after the response is sent or an error is forwarded.
 */
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
