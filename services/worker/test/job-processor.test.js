const assert = require('node:assert/strict');
const test = require('node:test');
const { processJob } = require('../src/utils/jobProcessor');
const { calculatePrimes } = require('../src/processors/prime');

test('calculatePrimes returns primes up to the provided limit', () => {
  assert.deepEqual(calculatePrimes({ limit: 20 }), {
    limit: 20,
    count: 8,
    lastPrime: 19,
    primes: [2, 3, 5, 7, 11, 13, 17, 19]
  });
});

test('processJob passes payload to prime processor', () => {
  assert.deepEqual(processJob('prime', { limit: 10 }), {
    limit: 10,
    count: 4,
    lastPrime: 7,
    primes: [2, 3, 5, 7]
  });
});

test('calculatePrimes rejects invalid limits', () => {
  assert.throws(() => calculatePrimes({ limit: 1 }), /Prime job limit/);
});

test('processJob rejects unsupported job types', () => {
  assert.throws(() => processJob('unknown'), /Unsupported job type/);
});
