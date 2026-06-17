const express = require('express');
const redis = require('../redis/client');

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const job = await redis.hgetall(`job:${req.params.id}`);

    if (!job || Object.keys(job).length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const response = {
      ...job,
      payload: job.payload ? JSON.parse(job.payload) : undefined,
      result: job.result ? JSON.parse(job.result) : undefined,
      error: job.error || undefined
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
