const { createLogger } = require('@microservices-monitoring/logger');
const { createJobRepository, createQueueRepository } = require('@microservices-monitoring/redis');
const {
  jobsProcessedTotal,
  jobProcessingTimeSeconds,
  jobErrorsTotal
} = require('../metrics/prometheus');
const { processJob } = require('../utils/jobProcessor');

const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';
const logger = createLogger('worker');

function createWorkerService(redis, blockingRedis, options = {}) {
  const jobRepository = options.jobRepository || createJobRepository(redis);
  const queueRepository =
    options.queueRepository || createQueueRepository(blockingRedis, queueName);
  const workerName = options.workerName || process.env.HOSTNAME || 'local-worker';

  async function handleJob(job) {
    const startedAt = Date.now();
    const labels = { type: job.type || 'unknown' };

    try {
      await jobRepository.markProcessing(job.id, workerName);

      const result = processJob(job.type);
      const durationSeconds = (Date.now() - startedAt) / 1000;

      await jobRepository.markCompleted(job.id, result, durationSeconds);

      jobsProcessedTotal.inc({ ...labels, status: 'success' });
      jobProcessingTimeSeconds.observe(labels, durationSeconds);
      logger.info('Completed job', { jobId: job.id, type: job.type, durationSeconds });
    } catch (error) {
      await jobRepository.markFailed(job.id, error.message);

      jobsProcessedTotal.inc({ ...labels, status: 'error' });
      jobErrorsTotal.inc(labels);
      logger.error('Failed job', { jobId: job.id, error: error.message });
    }
  }

  return {
    async consumeJobs() {
      logger.info('Worker listening for jobs', { queueName });

      while (true) {
        const job = await queueRepository.popJob(5);

        if (!job) {
          continue;
        }

        await handleJob(job);
      }
    },
    handleJob
  };
}

module.exports = { createWorkerService };
