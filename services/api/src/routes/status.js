const express = require('express');
const { getJobStatus } = require('../controllers/statusController');

const router = express.Router();

router.get('/:id', getJobStatus);

module.exports = router;
