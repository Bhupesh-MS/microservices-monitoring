const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { loadRootEnv, parseEnv } = require('../src');

test('parseEnv ignores comments and parses key values', () => {
  assert.deepEqual(parseEnv('PORT=3000\n# ignored\nREDIS_HOST=redis\nEMPTY=\n'), {
    PORT: '3000',
    REDIS_HOST: 'redis',
    EMPTY: ''
  });
});

test('loadRootEnv loads only requested keys without overriding existing values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'microservices-env-'));
  const serviceDir = path.join(tempDir, 'services', 'api');
  fs.mkdirSync(serviceDir, { recursive: true });
  fs.writeFileSync(
    path.join(tempDir, '.env'),
    'PORT=3000\nREDIS_HOST=redis\nJOB_QUEUE_NAME=jobs:queue\n'
  );

  const env = {
    PORT: '4000'
  };
  const loaded = loadRootEnv(['PORT', 'JOB_QUEUE_NAME'], { cwd: serviceDir, env });

  assert.deepEqual(loaded, { JOB_QUEUE_NAME: 'jobs:queue' });
  assert.deepEqual(env, { PORT: '4000', JOB_QUEUE_NAME: 'jobs:queue' });
});
