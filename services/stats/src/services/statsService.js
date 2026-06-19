const { createLogger } = require('@microservices-monitoring/logger');
const {
  createQueueRepository,
  createStatsRepository,
  getRedisClient
} = require('@microservices-monitoring/redis');

const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';
const logger = createLogger('stats');

/**
 * @typedef {object} StatsServiceOptions
 * @property {object} [redis] - Redis client used when a repository is not provided.
 * @property {{getLength(): Promise<number>}} [queueRepository] - Queue repository dependency.
 * @property {{getJobStats(): Promise<object>}} [statsRepository] - Stats repository dependency.
 */

/**
 * Creates a service for reading aggregate job statistics.
 *
 * @param {StatsServiceOptions} [options={}] - Optional dependencies for tests or alternate wiring.
 * @returns {{getStats(): Promise<object>}} Stats service methods.
 */
function createStatsService(options = {}) {
  let statsRepository = options.statsRepository;

  if (!statsRepository) {
    const redis = options.redis || getRedisClient({ logger });
    const queueRepository = options.queueRepository || createQueueRepository(redis, queueName);
    statsRepository = createStatsRepository(redis, queueRepository);
  }

  return {
    /**
     * Returns aggregate job counters, queue length, and average processing time.
     *
     * @returns {Promise<object>} Current aggregate job statistics.
     */
    getStats() {
      return statsRepository.getJobStats();
    }
  };
}

module.exports = { createStatsService };
