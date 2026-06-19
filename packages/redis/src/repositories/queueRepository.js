/**
 * @typedef {object} QueuedJob
 * @property {string} id - Unique job identifier.
 * @property {string} type - Job type to process.
 * @property {object} [payload] - Job input payload.
 */

/**
 * Creates a repository for blocking queue reads and queue length checks.
 *
 * @param {object} redis - Redis client or compatible test double.
 * @param {string} queueName - Redis list key used as the job queue.
 * @returns {{
 *   popJob(timeoutSeconds?: number): Promise<QueuedJob|undefined>,
 *   getLength(): Promise<number>
 * }} Queue repository methods.
 */
function createQueueRepository(redis, queueName) {
  return {
    /**
     * Pops the next queued job using a blocking Redis read.
     *
     * @param {number} [timeoutSeconds=5] - BLPOP timeout in seconds.
     * @returns {Promise<QueuedJob|undefined>} Parsed job, or undefined when the poll times out.
     * @throws {SyntaxError} When the queued job payload is invalid JSON.
     */
    async popJob(timeoutSeconds = 5) {
      const item = await redis.blpop(queueName, timeoutSeconds);

      if (!item) {
        return undefined;
      }

      const [, rawJob] = item;
      return JSON.parse(rawJob);
    },

    /**
     * Reads the current queue length.
     *
     * @returns {Promise<number>} Number of queued jobs.
     */
    async getLength() {
      return redis.llen(queueName);
    }
  };
}

module.exports = { createQueueRepository };
