const { calculatePrimes } = require('../processors/prime');

/**
 * Dispatches a queued job to the processor for its job type.
 *
 * @param {string} type - Job type to process.
 * @param {object} [payload={}] - Job payload.
 * @returns {object} Processor result.
 * @throws {Error} When the job type is unsupported or the processor rejects the payload.
 */
function processJob(type, payload = {}) {
  if (type === 'prime') {
    return calculatePrimes(payload);
  }

  throw new Error(`Unsupported job type: ${type}`);
}

module.exports = { processJob };
