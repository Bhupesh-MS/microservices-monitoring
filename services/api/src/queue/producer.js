const { randomUUID } = require('crypto');
const redis = require('../redis/client');

const queueName = process.env.JOB_QUEUE_NAME || 'jobs:queue';
const jobTypes = ['prime', 'bcrypt', 'sort'];

function pickJobType(type) {
  return jobTypes.includes(type) ? type : jobTypes[Math.floor(Math.random() * jobTypes.length)];
}

async function submitJob(payload = {}) {
  const id = randomUUID();
  const type = pickJobType(payload.type);
  const now = new Date().toISOString();
  const job = {
    id,
    type,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    payload: JSON.stringify(payload)
  };

  await redis
    .multi()
    .hset(`job:${id}`, job)
    .rpush(queueName, JSON.stringify({ id, type, payload }))
    .incr('stats:jobs_submitted')
    .exec();

  return { id, type, status: 'queued' };
}

module.exports = { submitJob };
