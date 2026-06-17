const Redis = require('ioredis');
const { createJobRepository } = require('./repositories/jobRepository');
const { createQueueRepository } = require('./repositories/queueRepository');
const { createStatsRepository } = require('./repositories/statsRepository');

const defaultLogger = {
  error: (message, meta) => {
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'redis',
      message,
      ...meta
    };

    console.error(JSON.stringify(payload));
  }
};

let sharedClient;

function createRedisClient(options = {}) {
  const logger = options.logger || defaultLogger;
  const redis = new Redis({
    host: options.host || process.env.REDIS_HOST || 'localhost',
    port: Number(options.port || process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: options.maxRetriesPerRequest ?? null
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error', { error: error.message });
  });

  return redis;
}

function getRedisClient(options = {}) {
  if (!sharedClient) {
    sharedClient = createRedisClient(options);
  }

  return sharedClient;
}

module.exports = {
  createRedisClient,
  getRedisClient,
  createJobRepository,
  createQueueRepository,
  createStatsRepository
};
