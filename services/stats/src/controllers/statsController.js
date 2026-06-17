const { createStatsService } = require('../services/statsService');

async function getStats(req, res, next) {
  try {
    const statsService = createStatsService();
    res.json(await statsService.getStats());
  } catch (error) {
    next(error);
  }
}

module.exports = { getStats };
