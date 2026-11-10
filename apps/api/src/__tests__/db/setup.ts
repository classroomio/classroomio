import 'dotenv/config';

// Point the database module at the dedicated test database before any test module loads `@cio/db`.
// `dotenv` does not overwrite an existing variable, so this wins over `apps/api/.env`.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// The database client prefers the pooled connection string when it is set. A developer shell (or `.env`)
// may point it at a real database, so drop it here: these tests must never run outside the test database.
delete process.env.PGBOUNCER_DATABASE_URL;

process.env.NODE_ENV = 'test';
process.env.ZAPIER_OAUTH_CLIENT_ID ??= 'test-zapier-client';
