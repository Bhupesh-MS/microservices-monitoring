const { createWorkerService } = require('../services/workerService');

async function consumeJobs(redis, blockingRedis) {
  return createWorkerService(redis, blockingRedis).consumeJobs();
}

module.exports = { consumeJobs };
