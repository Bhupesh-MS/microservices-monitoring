/**
 * Builds the stats service health payload.
 *
 * @returns {{status: 'ok', service: 'stats'}} Current health status.
 */
function getHealthStatus() {
  return { status: 'ok', service: 'stats' };
}

/**
 * Handles stats service health checks.
 *
 * @param {import('express').Request} _req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
function getHealth(_req, res) {
  res.json(getHealthStatus());
}

module.exports = { getHealth, getHealthStatus };
