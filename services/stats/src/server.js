const express = require('express');
const { loadRootEnv } = require('@microservices-monitoring/env');
const { createLogger } = require('@microservices-monitoring/logger');

loadRootEnv(['PORT', 'REDIS_HOST', 'REDIS_PORT', 'JOB_QUEUE_NAME']);

const { getHealth, getHealthStatus } = require('./controllers/healthController');
const { getMetrics } = require('./controllers/metricsController');
const { router: statsRouter } = require('./routes/stats');

const app = express();
const port = Number(process.env.PORT || 3000);
const logger = createLogger('stats');

app.get('/health', getHealth);

app.use('/stats', statsRouter);
app.get('/metrics', getMetrics);

app.use((error, _req, res, _next) => {
  logger.error('Unhandled request error', error);
  res.status(500).json({ error: 'Internal server error' });
});

function start() {
  return app.listen(port, () => {
    logger.info('Stats service listening', { port });
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, getHealthStatus, start };
