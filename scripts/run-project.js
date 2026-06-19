const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

/**
 * Parses dotenv-style values from a file path if it exists.
 *
 * @param {string} filePath - Environment file path.
 * @returns {Record<string, string>} Parsed environment values.
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return values;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex === -1) {
        return values;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');

      return { ...values, [key]: value };
    }, {});
}

const rootEnv = {
  ...parseEnvFile(envPath),
  ...process.env
};

const services = [
  {
    name: 'api',
    workspace: 'services/api',
    port: rootEnv.API_PORT || rootEnv.PORT || '3000'
  },
  {
    name: 'worker',
    workspace: 'services/worker',
    port: rootEnv.WORKER_PORT || '3001'
  },
  {
    name: 'stats',
    workspace: 'services/stats',
    port: rootEnv.STATS_PORT || '3002'
  }
];

const children = services.map((service) => {
  const child = spawn('npm', ['start', '--workspace', service.workspace], {
    cwd: rootDir,
    env: {
      ...rootEnv,
      PORT: service.port
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${service.name}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${service.name}] ${data}`);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      return;
    }

    if (code !== 0) {
      process.exitCode = code;
      stopAll();
    }
  });

  return child;
});

/**
 * Stops all child service processes started by this runner.
 *
 * @returns {void}
 */
function stopAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', () => {
  stopAll();
  process.exit(130);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(143);
});
