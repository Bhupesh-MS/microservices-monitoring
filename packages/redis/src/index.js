const Redis = require('ioredis');
const { createJobRepository } = require('./repositories/jobRepository');
const { createQueueRepository } = require('./repositories/queueRepository');
const { createStatsRepository } = require('./repositories/statsRepository');

/**
 * @typedef {object} RedisLogger
 * @property {(message: string, meta?: object) => void} error - Writes Redis error logs.
 */

/**
 * @typedef {object} RedisClientOptions
 * @property {string} [host] - Redis host name.
 * @property {string|number} [port] - Redis port.
 * @property {number|null} [maxRetriesPerRequest] - ioredis retry limit per request.
 * @property {RedisLogger} [logger] - Logger used for connection errors.
 */

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

/**
 * Creates a new Redis client configured from explicit options or environment variables.
 *
 * @param {RedisClientOptions} [options={}] - Redis connection options.
 * @returns {Redis} A new ioredis client instance.
 */
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

/**
 * Returns a process-wide shared Redis client, creating it on first use.
 *
 * @param {RedisClientOptions} [options={}] - Options used only when creating the shared client.
 * @returns {Redis} Shared ioredis client instance.
 */
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
