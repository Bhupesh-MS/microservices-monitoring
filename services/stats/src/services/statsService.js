const { createLogger } = require('@microservices-monitoring/logger');
const {
  createQueueRepository,
  createStatsRepository,
  getRedisClient
} = require('@microservices-monitoring/redis');

const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';
const logger = createLogger('stats');

function createStatsService(options = {}) {
  let statsRepository = options.statsRepository;

  if (!statsRepository) {
    const redis = options.redis || getRedisClient({ logger });
    const queueRepository = options.queueRepository || createQueueRepository(redis, queueName);
    statsRepository = createStatsRepository(redis, queueRepository);
  }

  return {
    getStats() {
      return statsRepository.getJobStats();
    }
  };
}

module.exports = { createStatsService };
