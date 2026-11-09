import 'dotenv/config';

// Point the database module at the dedicated test database before any test module loads `@cio/db`.
// `dotenv` does not overwrite an existing variable, so this wins over `apps/api/.env`.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

process.env.NODE_ENV = 'test';
process.env.ZAPIER_OAUTH_CLIENT_ID ??= 'test-zapier-client';
