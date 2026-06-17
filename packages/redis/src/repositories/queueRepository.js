function createQueueRepository(redis, queueName) {
  return {
    async popJob(timeoutSeconds = 5) {
      const item = await redis.blpop(queueName, timeoutSeconds);

      if (!item) {
        return undefined;
      }

      const [, rawJob] = item;
      return JSON.parse(rawJob);
    },

    async getLength() {
      return redis.llen(queueName);
    }
  };
}

module.exports = { createQueueRepository };
