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
  'PRIME_LIMIT',
  'PRIME_LIMIT_MAX',
  'CORS_ORIGIN',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS'
]);

const { getHealth, getHealthStatus } = require('./controllers/healthController');
const submitRouter = require('./routes/submit');
const statusRouter = require('./routes/status');

const app = express();
const port = Number(process.env.PORT || 3000);
const logger = createLogger('api');

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, methods: ['GET', 'POST'] }));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100)
});
app.use(limiter);

app.use(express.json({ limit: '1mb' }));

app.get('/health', getHealth);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/submit', submitRouter);
app.use('/status', statusRouter);

app.use((error, _req, res, _next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  logger.error('Unhandled request error', error);
  return res.status(500).json({ error: 'Internal server error' });
});

/**
 * Starts the API HTTP server.
 *
 * @returns {import('http').Server} Running HTTP server.
 */
function start() {
  return app.listen(port, () => {
    logger.info('API listening', { port });
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, getHealthStatus, start };
