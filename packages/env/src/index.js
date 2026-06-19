const fs = require('fs');
const path = require('path');

/**
 * Parses dotenv-style file contents into key/value pairs.
 *
 * @param {string} contents - Raw contents of an environment file.
 * @returns {Record<string, string>} Parsed environment variables.
 */
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

/**
 * Finds the nearest `.env` file by walking upward from a starting directory.
 *
 * @param {string} [startDir=process.cwd()] - Directory where the search starts.
 * @returns {string|undefined} Absolute path to the nearest `.env` file, if one exists.
 */
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

/**
 * @typedef {object} LoadRootEnvOptions
 * @property {NodeJS.ProcessEnv|Record<string, string|undefined>} [env] - Environment object to mutate.
 * @property {string} [envFilePath] - Explicit environment file path.
 * @property {string} [cwd] - Directory used when searching for a root `.env` file.
 */

/**
 * Loads selected keys from the root `.env` file without overriding existing values.
 *
 * @param {string[]} keys - Environment variable names allowed to be loaded.
 * @param {LoadRootEnvOptions} [options={}] - Loading options.
 * @returns {Record<string, string>} Values loaded into the target environment object.
 */
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
