/**
 * Wait for PostgreSQL database to be reachable before proceeding.
 * Pure Node.js TCP check - no extra dependencies needed.
 *
 * Usage: node wait-for-db.js
 *
 * Reads DATABASE_URL env var to extract host and port.
 * Retries every 2s for max 30 attempts (60s total).
 */

const net = require('net');

const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 2000;

function parseDatabaseUrl(url) {
  try {
    // DATABASE_URL format: postgresql://user:pass@host:port/dbname?params
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port, 10) || 5432,
    };
  } catch {
    console.error('Failed to parse DATABASE_URL, using defaults (localhost:5432)');
    return { host: 'localhost', port: 5432 };
  }
}

function tryConnect(host, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = 3000;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve();
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Connection to ${host}:${port} timed out`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.connect(port, host);
  });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL not set, skipping DB wait check');
    process.exit(0);
  }

  const { host, port } = parseDatabaseUrl(databaseUrl);
  console.log(`Waiting for database at ${host}:${port}...`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await tryConnect(host, port);
      console.log(`Database is reachable at ${host}:${port} (attempt ${attempt})`);
      process.exit(0);
    } catch (error) {
      console.log(
        `Attempt ${attempt}/${MAX_RETRIES}: DB not ready - ${error.message}`
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }
  }

  console.error(
    `Database at ${host}:${port} not reachable after ${MAX_RETRIES} attempts (${(MAX_RETRIES * RETRY_INTERVAL_MS) / 1000}s). Proceeding anyway...`
  );
  // Exit 0 to not block the container start - the app has its own retry logic
  process.exit(0);
}

main();
