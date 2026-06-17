const { calculatePrimes } = require('../processors/prime');
const { runBcryptHash } = require('../processors/bcrypt');
const { generateAndSort } = require('../processors/sort');
const {
  jobsProcessedTotal,
  jobProcessingTimeSeconds,
  jobErrorsTotal
} = require('../metrics/prometheus');

const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';

function processJob(type) {
  if (type === 'prime') {
    return calculatePrimes();
  }

  if (type === 'bcrypt') {
    return runBcryptHash();
  }

  if (type === 'sort') {
    return generateAndSort();
  }

  throw new Error(`Unsupported job type: ${type}`);
}

async function consumeJobs(redis, blockingRedis) {
  console.log(`Worker listening for jobs on queue ${queueName}`);

  while (true) {
    const item = await blockingRedis.blpop(queueName, 5);

    if (!item) {
      continue;
    }

    const [, rawJob] = item;
    const job = JSON.parse(rawJob);
    const startedAt = Date.now();
    const labels = { type: job.type || 'unknown' };

    try {
      await redis.hset(`job:${job.id}`, {
        status: 'processing',
        worker: process.env.HOSTNAME || 'local-worker',
        updatedAt: new Date().toISOString()
      });

      const result = processJob(job.type);
      const durationSeconds = (Date.now() - startedAt) / 1000;

      await redis
        .multi()
        .hset(`job:${job.id}`, {
          status: 'completed',
          result: JSON.stringify(result),
          processingTimeSeconds: durationSeconds.toString(),
          updatedAt: new Date().toISOString()
        })
        .incr('stats:jobs_completed')
        .incrbyfloat('stats:processing_time_seconds_sum', durationSeconds)
        .incr('stats:processing_time_count')
        .exec();

      jobsProcessedTotal.inc({ ...labels, status: 'success' });
      jobProcessingTimeSeconds.observe(labels, durationSeconds);
      console.log(`Completed job ${job.id} (${job.type}) in ${durationSeconds}s`);
    } catch (error) {
      await redis
        .multi()
        .hset(`job:${job.id}`, {
          status: 'failed',
          error: error.message,
          updatedAt: new Date().toISOString()
        })
        .incr('stats:job_errors')
        .exec();

      jobsProcessedTotal.inc({ ...labels, status: 'error' });
      jobErrorsTotal.inc(labels);
      console.error(`Failed job ${job.id}:`, error);
    }
  }
}

module.exports = { consumeJobs };
