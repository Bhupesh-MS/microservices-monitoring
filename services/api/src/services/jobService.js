const { randomUUID } = require('crypto');
const { createLogger } = require('@microservices-monitoring/logger');
const { createJobRepository, getRedisClient } = require('@microservices-monitoring/redis');
const { normalizeSubmitPayload } = require('../utils/submitPayload');

const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';
const logger = createLogger('api');

/**
 * @typedef {import('../utils/submitPayload').NormalizedSubmitPayload} NormalizedSubmitPayload
 */

/**
 * @typedef {object} SubmittedJob
 * @property {string} id - Unique job identifier.
 * @property {'prime'} type - Job type queued for processing.
 * @property {'queued'} status - Initial job status.
 * @property {NormalizedSubmitPayload} payload - Validated job payload.
 */

/**
 * Creates the API job service for job submission and lookup.
 *
 * @param {object} [options={}] - Optional dependencies for tests or alternate runtime wiring.
 * @param {object} [options.redis] - Redis client used when a repository is not provided.
 * @param {object} [options.jobRepository] - Job repository implementation.
 * @returns {{
 *   submitJob(payload?: object): Promise<SubmittedJob>,
 *   getJobStatus(id: string): Promise<object|undefined>
 * }} Job service methods.
 */
function createJobService(options = {}) {
  const redis = options.redis;
  const jobRepository =
    options.jobRepository || createJobRepository(redis || getRedisClient({ logger }));

  return {
    /**
     * Validates a submit payload, stores a queued job, and pushes it onto Redis.
     *
     * @param {object} [payload={}] - Raw submit request body.
     * @returns {Promise<SubmittedJob>} Accepted queued job details.
     * @throws {import('../utils/submitPayload').ValidationError} When the payload is invalid.
     */
    async submitJob(payload = {}) {
      const id = randomUUID();
      const normalizedPayload = normalizeSubmitPayload(payload);
      const type = 'prime';
      const now = new Date().toISOString();
      const job = {
        id,
        type,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
        payload: normalizedPayload
      };

      logger.info('Queueing job', { jobId: id, type, limit: normalizedPayload.limit });
      await jobRepository.createQueuedJob(job, queueName);
      logger.info('Job state changed', {
        jobId: id,
        type,
        status: 'queued',
        queueName,
        limit: normalizedPayload.limit
      });

      return { id, type, status: 'queued', payload: normalizedPayload };
    },

    /**
     * Looks up the current persisted state for a job.
     *
     * @param {string} id - Job identifier.
     * @returns {Promise<object|undefined>} Stored job record, or undefined when absent.
     */
    async getJobStatus(id) {
      return jobRepository.findById(id);
    }
  };
}

module.exports = { createJobService };
