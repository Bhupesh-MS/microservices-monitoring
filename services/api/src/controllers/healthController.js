/**
 * Builds the API service health payload.
 *
 * @returns {{status: 'ok', service: 'api'}} Current health status.
 */
function getHealthStatus() {
  return { status: 'ok', service: 'api' };
}

/**
 * Handles API health checks.
 *
 * @param {import('express').Request} _req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
function getHealth(_req, res) {
  res.json(getHealthStatus());
}

module.exports = { getHealth, getHealthStatus };
