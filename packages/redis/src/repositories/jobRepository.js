/**
 * @typedef {object} JobPayload
 * @property {number} limit - Inclusive upper bound for the prime calculation.
 */

/**
 * @typedef {object} JobRecord
 * @property {string} id - Unique job identifier.
 * @property {string} type - Job type, currently `prime`.
 * @property {'queued'|'processing'|'completed'|'failed'} status - Current job lifecycle status.
 * @property {string} [createdAt] - ISO timestamp when the job was created.
 * @property {string} [updatedAt] - ISO timestamp when the job was last updated.
 * @property {JobPayload} [payload] - Job input payload.
 * @property {object} [result] - Job result when completed.
 * @property {string} [error] - Error message when failed.
 */

/**
 * Parses a JSON string stored in Redis, returning undefined for empty values.
 *
 * @param {string|undefined|null} value - Redis string value.
 * @returns {object|undefined} Parsed object, if a value was present.
 * @throws {SyntaxError} When Redis contains invalid JSON.
 */
function parseJson(value) {
  return value ? JSON.parse(value) : undefined;
}

/**
 * Converts a Redis hash into a normalized job record.
 *
 * @param {Record<string, string>|undefined|null} job - Raw Redis hash result.
 * @returns {JobRecord|undefined} Normalized job record, or undefined when missing.
 * @throws {SyntaxError} When stored payload or result JSON is invalid.
 */
function mapJobRecord(job) {
  if (!job || Object.keys(job).length === 0) {
    return undefined;
  }

  return {
    ...job,
    payload: parseJson(job.payload),
    result: parseJson(job.result),
    error: job.error || undefined
  };
}

/**
 * Creates a repository for persisting job state and lifecycle counters in Redis.
 *
 * @param {object} redis - Redis client or compatible test double.
 * @returns {{
 *   findById(id: string): Promise<JobRecord|undefined>,
 *   createQueuedJob(job: JobRecord, queueName: string): Promise<void>,
 *   markProcessing(id: string, workerName: string): Promise<void>,
 *   markCompleted(id: string, result: object, durationSeconds: number): Promise<void>,
 *   markFailed(id: string, errorMessage: string): Promise<void>
 * }} Job repository methods.
 */
function createJobRepository(redis) {
  return {
    /**
     * Finds a stored job record by identifier.
     *
     * @param {string} id - Job identifier.
     * @returns {Promise<JobRecord|undefined>} Stored job record, or undefined when absent.
     */
    async findById(id) {
      return mapJobRecord(await redis.hgetall(`job:${id}`));
    },

    /**
     * Persists a queued job, pushes it to the queue, and increments the submitted counter.
     *
     * @param {JobRecord} job - Job record to store.
     * @param {string} queueName - Redis queue list key.
     * @returns {Promise<void>} Resolves after Redis writes complete.
     */
    async createQueuedJob(job, queueName) {
      await redis
        .multi()
        .hset(`job:${job.id}`, {
          ...job,
          payload: JSON.stringify(job.payload)
        })
        .rpush(queueName, JSON.stringify({ id: job.id, type: job.type, payload: job.payload }))
        .incr('stats:jobs_submitted')
        .exec();
    },

    /**
     * Marks a job as actively processing by a worker.
     *
     * @param {string} id - Job identifier.
     * @param {string} workerName - Worker instance name.
     * @returns {Promise<void>} Resolves after Redis is updated.
     */
    async markProcessing(id, workerName) {
      await redis.hset(`job:${id}`, {
        status: 'processing',
        worker: workerName,
        updatedAt: new Date().toISOString()
      });
    },

    /**
     * Marks a job as completed and updates completion counters.
     *
     * @param {string} id - Job identifier.
     * @param {object} result - Processor result to store.
     * @param {number} durationSeconds - Processing duration in seconds.
     * @returns {Promise<void>} Resolves after Redis writes complete.
     */
    async markCompleted(id, result, durationSeconds) {
      await redis
        .multi()
        .hset(`job:${id}`, {
          status: 'completed',
          result: JSON.stringify(result),
          processingTimeSeconds: durationSeconds.toString(),
          updatedAt: new Date().toISOString()
        })
        .incr('stats:jobs_completed')
        .incrbyfloat('stats:processing_time_seconds_sum', durationSeconds)
        .incr('stats:processing_time_count')
        .exec();
    },

    /**
     * Marks a job as failed and increments the error counter.
     *
     * @param {string} id - Job identifier.
     * @param {string} errorMessage - Failure reason.
     * @returns {Promise<void>} Resolves after Redis writes complete.
     */
    async markFailed(id, errorMessage) {
      await redis
        .multi()
        .hset(`job:${id}`, {
          status: 'failed',
          error: errorMessage,
          updatedAt: new Date().toISOString()
        })
        .incr('stats:job_errors')
        .exec();
    }
  };
}

module.exports = { createJobRepository, mapJobRecord };
