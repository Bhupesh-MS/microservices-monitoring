const { createJobService } = require('../services/jobService');

/**
 * Handles prime job submission requests.
 *
 * @param {import('express').Request} req - Express request containing the submit payload.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express error handler callback.
 * @returns {Promise<void>} Resolves after the response is sent or an error is forwarded.
 */
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
