const express = require('express');
const { submitJob } = require('../controllers/submitController');

const router = express.Router();

router.post('/', submitJob);

module.exports = router;
