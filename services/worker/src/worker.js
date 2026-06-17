const express = require('express');
const { createRedisClient } = require('./redis/client');
const { consumeJobs } = require('./queue/consumer');
const { register } = require('./metrics/prometheus');

const app = express();
const port = Number(process.env.PORT || 3000);
const redis = createRedisClient();
const blockingRedis = createRedisClient();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'worker' });
});

app.get('/metrics', async (_req, res, next) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => {
  console.log(`Worker metrics server listening on port ${port}`);
});

consumeJobs(redis, blockingRedis).catch((error) => {
  console.error('Worker stopped unexpectedly:', error);
  process.exit(1);
});
