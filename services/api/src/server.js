const express = require('express');
const { loadRootEnv } = require('@microservices-monitoring/env');
const { createLogger } = require('@microservices-monitoring/logger');

loadRootEnv(['PORT', 'REDIS_HOST', 'REDIS_PORT', 'JOB_QUEUE_NAME']);

const { getHealth, getHealthStatus } = require('./controllers/healthController');
const submitRouter = require('./routes/submit');
const statusRouter = require('./routes/status');

const app = express();
const port = Number(process.env.PORT || 3000);
const logger = createLogger('api');

app.use(express.json({ limit: '1mb' }));

app.get('/health', getHealth);

app.use('/submit', submitRouter);
app.use('/status', statusRouter);

app.use((error, _req, res, _next) => {
  logger.error('Unhandled request error', error);
  res.status(500).json({ error: 'Internal server error' });
});

function start() {
  return app.listen(port, () => {
    logger.info('API listening', { port });
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, getHealthStatus, start };
