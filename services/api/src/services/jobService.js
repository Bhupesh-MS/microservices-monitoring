const { randomUUID } = require('crypto');
const { createLogger } = require('@microservices-monitoring/logger');
const { createJobRepository, getRedisClient } = require('@microservices-monitoring/redis');
const { pickJobType } = require('../utils/jobTypes');

const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';
const logger = createLogger('api');

function createJobService(options = {}) {
  const redis = options.redis;
  const jobRepository =
    options.jobRepository || createJobRepository(redis || getRedisClient({ logger }));

  return {
    async submitJob(payload = {}) {
      const id = randomUUID();
      const type = pickJobType(payload.type);
      const now = new Date().toISOString();
      const job = {
        id,
        type,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
        payload
      };

      await jobRepository.createQueuedJob(job, queueName);

      return { id, type, status: 'queued' };
    },

    async getJobStatus(id) {
      return jobRepository.findById(id);
    }
  };
}

module.exports = { createJobService };
