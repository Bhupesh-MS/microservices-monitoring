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

/**
 * @typedef {object} WorkerJob
 * @property {string} id - Unique job identifier.
 * @property {string} type - Job type to process.
 * @property {object} [payload] - Job payload.
 */

/**
 * @typedef {object} WorkerServiceOptions
 * @property {object} [jobRepository] - Repository used for job lifecycle updates.
 * @property {object} [queueRepository] - Repository used for blocking queue reads.
 * @property {string} [workerName] - Name recorded on processing jobs.
 */

/**
 * Creates a worker service that consumes queued jobs and records lifecycle state.
 *
 * @param {object} redis - Redis client used for job state writes.
 * @param {object} blockingRedis - Redis client used for blocking queue reads.
 * @param {WorkerServiceOptions} [options={}] - Optional dependencies and worker settings.
 * @returns {{
 *   consumeJobs(): Promise<void>,
 *   handleJob(job: WorkerJob): Promise<void>
 * }} Worker service methods.
 */
function createWorkerService(redis, blockingRedis, options = {}) {
  const jobRepository = options.jobRepository || createJobRepository(redis);
  const queueRepository =
    options.queueRepository || createQueueRepository(blockingRedis, queueName);
  const workerName = options.workerName || process.env.HOSTNAME || 'local-worker';

  /**
   * Processes one queued job and records success or failure state.
   *
   * @param {WorkerJob} job - Queued job to process.
   * @returns {Promise<void>} Resolves after lifecycle state and metrics are updated.
   */
  async function handleJob(job) {
    const startedAt = Date.now();
    const labels = { type: job.type || 'unknown' };

    try {
      await jobRepository.markProcessing(job.id, workerName);
      logger.info('Job state changed', {
        jobId: job.id,
        type: job.type,
        status: 'processing',
        worker: workerName,
        limit: job.payload?.limit
      });

      const result = processJob(job.type, job.payload || {});
      const durationSeconds = (Date.now() - startedAt) / 1000;

      await jobRepository.markCompleted(job.id, result, durationSeconds);
      logger.info('Job state changed', {
        jobId: job.id,
        type: job.type,
        status: 'completed',
        worker: workerName,
        durationSeconds,
        resultCount: result.count
      });

      jobsProcessedTotal.inc({ ...labels, status: 'success' });
      jobProcessingTimeSeconds.observe(labels, durationSeconds);
      logger.info('Completed job', { jobId: job.id, type: job.type, durationSeconds });
    } catch (error) {
      await jobRepository.markFailed(job.id, error.message);
      logger.error('Job state changed', {
        jobId: job.id,
        type: job.type,
        status: 'failed',
        worker: workerName,
        error: error.message
      });

      jobsProcessedTotal.inc({ ...labels, status: 'error' });
      jobErrorsTotal.inc(labels);
      logger.error('Failed job', { jobId: job.id, error: error.message });
    }
  }

  return {
    /**
     * Continuously consumes jobs from Redis until the loop throws or the process exits.
     *
     * @returns {Promise<void>} Promise that does not resolve during normal operation.
     * @throws {Error} When queue polling or job handling raises an unexpected error.
     */
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
