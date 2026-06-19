/**
 * @typedef {object} JobStats
 * @property {number} totalJobsSubmitted - Total jobs submitted through the API.
 * @property {number} totalJobsCompleted - Total jobs completed by workers.
 * @property {number} totalJobErrors - Total jobs that failed during processing.
 * @property {number} queueLength - Current Redis queue length.
 * @property {number} avgProcessingTimeSeconds - Average completed job processing time in seconds.
 */

/**
 * Creates a repository for aggregate job statistics stored in Redis.
 *
 * @param {object} redis - Redis client or compatible test double.
 * @param {{getLength(): Promise<number>}} queueRepository - Queue repository used for length checks.
 * @returns {{getJobStats(): Promise<JobStats>}} Stats repository methods.
 */
function createStatsRepository(redis, queueRepository) {
  return {
    /**
     * Reads aggregate job counters and derives average processing time.
     *
     * @returns {Promise<JobStats>} Current aggregate job statistics.
     */
    async getJobStats() {
      const [submitted, completed, errors, queueLength, processingTimeSum, processingTimeCount] =
        await Promise.all([
          redis.get('stats:jobs_submitted'),
          redis.get('stats:jobs_completed'),
          redis.get('stats:job_errors'),
          queueRepository.getLength(),
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
  };
}

module.exports = { createStatsRepository };
