const fs = require('fs');
const path = require('path');

function parseEnv(contents) {
  return contents.split(/\r?\n/).reduce((values, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return values;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      return values;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    return { ...values, [key]: value };
  }, {});
}

function findRootEnv(startDir = process.cwd()) {
  let currentDir = startDir;

  while (true) {
    const candidate = path.join(currentDir, '.env');

    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function loadRootEnv(keys, options = {}) {
  const env = options.env || process.env;
  const envFilePath = options.envFilePath || findRootEnv(options.cwd);

  if (!envFilePath) {
    return {};
  }

  const parsed = parseEnv(fs.readFileSync(envFilePath, 'utf8'));
  const allowedKeys = new Set(keys);
  const loaded = {};

  for (const key of allowedKeys) {
    if (env[key] === undefined && parsed[key] !== undefined) {
      env[key] = parsed[key];
      loaded[key] = parsed[key];
    }
  }

  return loaded;
}

module.exports = { loadRootEnv, parseEnv };
