const express = require('express');
const { submitJob } = require('../queue/producer');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const job = await submitJob(req.body || {});
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const job = await submitJob({});
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
