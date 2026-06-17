const express = require('express');
const { loadRootEnv } = require('@microservices-monitoring/env');
const { createLogger } = require('@microservices-monitoring/logger');
const { createRedisClient } = require('@microservices-monitoring/redis');

loadRootEnv([
  'PORT',
  'REDIS_HOST',
  'REDIS_PORT',
  'JOB_QUEUE_NAME',
  'PRIME_LIMIT',
  'BCRYPT_ROUNDS',
  'SORT_SIZE'
]);

const { getHealth, getHealthStatus } = require('./controllers/healthController');
const { getMetrics } = require('./controllers/metricsController');
const { createWorkerService } = require('./services/workerService');

const app = express();
const port = Number(process.env.PORT || 3000);
const logger = createLogger('worker');

app.get('/health', getHealth);
app.get('/metrics', getMetrics);

function start() {
  const redis = createRedisClient({ logger });
  const blockingRedis = createRedisClient({ logger });

  const server = app.listen(port, () => {
    logger.info('Worker metrics server listening', { port });
  });

  createWorkerService(redis, blockingRedis)
    .consumeJobs()
    .catch((error) => {
      logger.error('Worker stopped unexpectedly', error);
      process.exit(1);
    });

  return server;
}

if (require.main === module) {
  start();
}

module.exports = { app, getHealthStatus, start };
