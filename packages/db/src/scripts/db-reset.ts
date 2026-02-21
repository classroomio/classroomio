import 'dotenv/config';

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldSeed = !process.argv.includes('--skip-seed');
const shouldSyncSchema = !process.argv.includes('--skip-schema-sync');
const scriptPath = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(scriptPath), '../..');
const pnpmBinary = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runPnpmCommand(commandLabel: string, args: string[]) {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(pnpmBinary, args, {
      cwd: packageRoot,
      env: process.env,
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      rejectPromise(error);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${commandLabel} command failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function truncatePublicTables() {
  const sql = postgres(connectionString);

  try {
    console.log('Resetting database tables in public schema...');
    await sql`
      DO $$
      DECLARE
        table_record RECORD;
      BEGIN
        FOR table_record IN
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
        LOOP
          EXECUTE format('TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE', 'public', table_record.tablename);
        END LOOP;
      END $$;
    `;
    console.log('✓ Public schema tables reset');
  } finally {
    await sql.end();
  }
}

async function runSetupAndSeed() {
  const args = ['db:setup'];

  if (!shouldSyncSchema) {
    args.push('--', '--skip-schema-sync');
  }

  if (shouldSeed) {
    if (!shouldSyncSchema) {
      args.push('--seed');
    } else {
      args.push('--', '--seed');
    }
  }

  await runPnpmCommand('DB setup', args);
}

async function resetDatabase() {
  try {
    await truncatePublicTables();
    await runSetupAndSeed();
    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }
}

resetDatabase();
