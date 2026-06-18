const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeSubmitPayload } = require('../src/utils/submitPayload');

test('normalizes payloads with only a limit field', () => {
  assert.deepEqual(normalizeSubmitPayload({ limit: '31' }), { limit: 31 });
});

test('rejects payloads without exactly one limit field', () => {
  assert.throws(() => normalizeSubmitPayload({}), /only the limit field/);
  assert.throws(() => normalizeSubmitPayload({ limit: 13, type: 'prime' }), /only the limit field/);
  assert.throws(() => normalizeSubmitPayload({ value: 13 }), /only the limit field/);
  assert.throws(() => normalizeSubmitPayload(13), /JSON object/);
});

test('rejects limits above configured max', () => {
  const originalMax = process.env.PRIME_LIMIT_MAX;
  process.env.PRIME_LIMIT_MAX = '10';

  assert.throws(() => normalizeSubmitPayload({ limit: 11 }), /less than or equal to 10/);

  if (originalMax === undefined) {
    delete process.env.PRIME_LIMIT_MAX;
  } else {
    process.env.PRIME_LIMIT_MAX = originalMax;
  }
});
