const express = require('express');
const redis = require('../redis/client');

const router = express.Router();
const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';

async function getStats() {
  const [
    submitted,
    completed,
    errors,
    queueLength,
    processingTimeSum,
    processingTimeCount
  ] = await Promise.all([
    redis.get('stats:jobs_submitted'),
    redis.get('stats:jobs_completed'),
    redis.get('stats:job_errors'),
    redis.llen(queueName),
    redis.get('stats:processing_time_seconds_sum'),
    redis.get('stats:processing_time_count')
  ]);

  const count = Number(processingTimeCount || 0);
  const totalTime = Number(processingTimeSum || 0);

  return {
    totalJobsSubmitted: Number(submitted || 0),
    totalJobsCompleted: Number(completed || 0),
    totalJobErrors: Number(errors || 0),
    queueLength,
    avgProcessingTimeSeconds: count > 0 ? totalTime / count : 0
  };
}

router.get('/', async (_req, res, next) => {
  try {
    res.json(await getStats());
  } catch (error) {
    next(error);
  }
});

module.exports = { router, getStats };
