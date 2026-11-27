// Loads .env once and fails fast when a required key is missing.
require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const dbNameFromEnv = process.env.DB_NAME;
let databaseUrl = process.env.DATABASE_URL || null;
let databaseName = dbNameFromEnv || null;

if (databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
      throw new Error('invalid PostgreSQL URL');
    }
    databaseName = decodeURIComponent(url.pathname.slice(1));
    if (nodeEnv === 'test') {
      databaseName = `${databaseName}_test`;
      url.pathname = `/${encodeURIComponent(databaseName)}`;
      databaseUrl = url.toString();
      process.env.DATABASE_URL = databaseUrl;
    }
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL with a database name.');
  }
} else if (nodeEnv === 'test' && databaseName) {
  databaseName = `${databaseName}_test`;
}

const databaseKeys = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const REQUIRED = [
  ...(databaseUrl ? [] : databaseKeys),
  'HUB_API_KEY',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CORS_ORIGINS',
];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required .env keys: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in your own values.'
  );
}

module.exports = {
  nodeEnv,
  port: Number(process.env.PORT) || 3001,
  databaseUrl,
  hubApiKey: process.env.HUB_API_KEY,
  corsOrigins: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  bcryptRounds: 10,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  db: {
    name: databaseName,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
  },
};
