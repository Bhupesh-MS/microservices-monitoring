const { createWorkerService } = require('../services/workerService');

/**
 * Starts consuming queued jobs with a worker service instance.
 *
 * @param {object} redis - Redis client used for job state writes.
 * @param {object} blockingRedis - Redis client used for blocking queue reads.
 * @returns {Promise<void>} Promise that runs until the consumer stops or fails.
 */
async function consumeJobs(redis, blockingRedis) {
  return createWorkerService(redis, blockingRedis).consumeJobs();
}

module.exports = { consumeJobs };
