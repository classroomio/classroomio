// packages/db/src/test/setup.ts
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll } from 'vitest';
import * as schema from '../schema';

export let testDb: ReturnType<typeof drizzle<typeof schema>>;
let client: ReturnType<typeof postgres>;

beforeAll(async () => {
  const connectionString = process.env.TEST_DATABASE_URL ||
    'postgresql://user:password@localhost:5432/test_db';

  client = postgres(connectionString, { max: 1 });
  testDb = drizzle(client, { schema });

  await migrate(testDb, { migrationsFolder: './src/test_migrations' });

  await testDb.execute(sql`
    DO $$
    DECLARE
      stmt text;
    BEGIN
      SELECT INTO stmt
        'TRUNCATE TABLE ' ||
        string_agg(format('%I.%I', schemaname, tablename), ', ') ||
        ' CASCADE'
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE '__drizzle_%';

      IF stmt IS NOT NULL THEN
        EXECUTE stmt;
      END IF;
    END $$;
  `);
});

afterAll(async () => {
  await client.end();
});