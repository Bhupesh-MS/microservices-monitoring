const { collectStatsMetrics, register } = require('../metrics/prometheus');

async function getMetrics(_req, res, next) {
  try {
    await collectStatsMetrics();
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
}

module.exports = { getMetrics };
