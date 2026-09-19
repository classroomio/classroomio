import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

import { resolveMigratorDatabaseUrl } from './src/migrator-database-url';

export default defineConfig({
  schema: './src/schema.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: resolveMigratorDatabaseUrl()
  }
});
