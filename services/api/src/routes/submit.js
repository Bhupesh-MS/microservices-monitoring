const express = require('express');
const { submitDefaultJob, submitJob } = require('../controllers/submitController');

const router = express.Router();

router.post('/', submitJob);
router.get('/', submitDefaultJob);

module.exports = router;
