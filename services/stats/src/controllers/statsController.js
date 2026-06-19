const { createStatsService } = require('../services/statsService');

/**
 * Handles aggregate job statistics requests.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express error handler callback.
 * @returns {Promise<void>} Resolves after stats are written or an error is forwarded.
 */
async function getStats(req, res, next) {
  try {
    const statsService = createStatsService();
    res.json(await statsService.getStats());
  } catch (error) {
    next(error);
  }
}

module.exports = { getStats };
