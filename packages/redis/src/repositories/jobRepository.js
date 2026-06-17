function parseJson(value) {
  return value ? JSON.parse(value) : undefined;
}

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

function createJobRepository(redis) {
  return {
    async findById(id) {
      return mapJobRecord(await redis.hgetall(`job:${id}`));
    },

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

    async markProcessing(id, workerName) {
      await redis.hset(`job:${id}`, {
        status: 'processing',
        worker: workerName,
        updatedAt: new Date().toISOString()
      });
    },

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
