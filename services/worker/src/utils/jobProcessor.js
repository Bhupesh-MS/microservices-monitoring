const { calculatePrimes } = require('../processors/prime');
const { runBcryptHash } = require('../processors/bcrypt');
const { generateAndSort } = require('../processors/sort');

function processJob(type) {
  if (type === 'prime') {
    return calculatePrimes();
  }

  if (type === 'bcrypt') {
    return runBcryptHash();
  }

  if (type === 'sort') {
    return generateAndSort();
  }

  throw new Error(`Unsupported job type: ${type}`);
}

module.exports = { processJob };
