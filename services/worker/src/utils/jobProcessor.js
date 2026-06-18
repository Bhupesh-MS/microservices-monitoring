const { calculatePrimes } = require('../processors/prime');

function processJob(type, payload = {}) {
  if (type === 'prime') {
    return calculatePrimes(payload);
  }

  throw new Error(`Unsupported job type: ${type}`);
}

module.exports = { processJob };
