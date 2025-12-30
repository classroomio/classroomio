import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';
const { NODE_ENV, TEST } = process.env

export default defineConfig({
  schema: './src/schema.ts',
  out: NODE_ENV === 'test' || TEST === "1" ? './src/test_migrations' : './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
});
