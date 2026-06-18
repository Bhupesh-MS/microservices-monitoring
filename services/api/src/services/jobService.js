const { randomUUID } = require('crypto');
const { createLogger } = require('@microservices-monitoring/logger');
const { createJobRepository, getRedisClient } = require('@microservices-monitoring/redis');
const { normalizeSubmitPayload } = require('../utils/submitPayload');

const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';
const logger = createLogger('api');

function createJobService(options = {}) {
  const redis = options.redis;
  const jobRepository =
    options.jobRepository || createJobRepository(redis || getRedisClient({ logger }));

  return {
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

    async getJobStatus(id) {
      return jobRepository.findById(id);
    }
  };
}

module.exports = { createJobService };
