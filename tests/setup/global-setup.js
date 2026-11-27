// Runs ONCE before all tests. Jest sets NODE_ENV=test, so src/config/env.js picks
// the test database (<DB_NAME>_test): your own data is never touched.
// The test database is rebuilt from the migrations and the seed data every run,
// so every test run starts from the same, known rows.
const { execSync } = require('child_process');
const { Client } = require('pg');
require('dotenv').config({ quiet: true });
const baseDatabaseUrl = process.env.DATABASE_URL || null;
const env = require('../../src/config/env');

module.exports = async () => {
  const run = (command) => execSync(command, {
    stdio: 'pipe',
    env: {
      ...process.env,
      ...(baseDatabaseUrl ? { DATABASE_URL: baseDatabaseUrl } : {}),
      NODE_ENV: 'test',
    },
  });
  const connection = env.databaseUrl
    ? new URL(env.databaseUrl)
    : {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
    };
  if (env.databaseUrl) {
    connection.pathname = '/postgres';
  }
  const client = new Client({
    ...(env.databaseUrl ? { connectionString: connection.toString() } : { ...connection, database: 'postgres' }),
    ...(env.db.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE "${env.db.name.replace(/"/g, '""')}"`);
  } catch (error) {
    if (error.code !== '42P04') throw error;
  } finally {
    await client.end();
  }

  run('node scripts/db-wipe.js');
  run('npx sequelize-cli db:migrate');
  run('npx sequelize-cli db:seed:all');
  if (baseDatabaseUrl) process.env.DATABASE_URL = baseDatabaseUrl;
};
