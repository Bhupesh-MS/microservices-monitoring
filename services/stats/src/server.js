const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { loadRootEnv } = require('@microservices-monitoring/env');
const { createLogger } = require('@microservices-monitoring/logger');
const swaggerDocument = require('../swagger.json');

loadRootEnv([
  'PORT',
  'REDIS_HOST',
  'REDIS_PORT',
  'JOB_QUEUE_NAME',
  'CORS_ORIGIN',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS'
]);

const { getHealth, getHealthStatus } = require('./controllers/healthController');
const { getMetrics } = require('./controllers/metricsController');
const { router: statsRouter } = require('./routes/stats');

const app = express();
const port = Number(process.env.PORT || 3000);
const logger = createLogger('stats');

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, methods: ['GET', 'POST'] }));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100)
});
app.use(limiter);

app.get('/health', getHealth);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/stats', statsRouter);
app.get('/metrics', getMetrics);

app.use((error, _req, res, _next) => {
  logger.error('Unhandled request error', error);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Starts the stats HTTP server.
 *
 * @returns {import('http').Server} Running HTTP server.
 */
function start() {
  return app.listen(port, () => {
    logger.info('Stats service listening', { port });
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, getHealthStatus, start };
