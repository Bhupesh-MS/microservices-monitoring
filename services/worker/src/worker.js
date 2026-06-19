const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { loadRootEnv } = require('@microservices-monitoring/env');
const { createLogger } = require('@microservices-monitoring/logger');
const { createRedisClient } = require('@microservices-monitoring/redis');
const swaggerDocument = require('../swagger.json');

loadRootEnv([
  'PORT',
  'REDIS_HOST',
  'REDIS_PORT',
  'JOB_QUEUE_NAME',
  'PRIME_LIMIT',
  'PRIME_LIMIT_MAX'
]);

const { getHealth, getHealthStatus } = require('./controllers/healthController');
const { getMetrics } = require('./controllers/metricsController');
const { createWorkerService } = require('./services/workerService');

const app = express();
const port = Number(process.env.PORT || 3000);
const logger = createLogger('worker');

app.get('/health', getHealth);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/metrics', getMetrics);

/**
 * Starts the worker metrics HTTP server and background queue consumer.
 *
 * @returns {import('http').Server} Running HTTP server.
 */
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
