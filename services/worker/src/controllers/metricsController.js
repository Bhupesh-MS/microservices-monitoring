const { register } = require('../metrics/prometheus');

/**
 * Handles Prometheus metrics scrape requests for the worker.
 *
 * @param {import('express').Request} _req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express error handler callback.
 * @returns {Promise<void>} Resolves after metrics are written or an error is forwarded.
 */
async function getMetrics(_req, res, next) {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
}

module.exports = { getMetrics };
