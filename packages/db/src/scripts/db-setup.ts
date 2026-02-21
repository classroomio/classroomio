import 'dotenv/config';

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldSeed = process.argv.includes('--seed') || process.argv.includes('-s');
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

async function runSchemaSync() {
  console.log('Syncing schema with drizzle-kit push...');
  await runPnpmCommand('Schema sync', ['db', 'push']);
}

async function runSeed() {
  console.log('Seeding database...');
  await runPnpmCommand('Seed', ['seed']);
}

async function dbSetup() {
  const sql = postgres(connectionString);

  try {
    console.log('Setting up database roles...');
    // Create authenticated role if it doesn't exist (used in RLS policies)
    const authenticatedRoleExists = await sql`
      SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'
    `;
    if (authenticatedRoleExists.length === 0) {
      await sql`CREATE ROLE authenticated`;
      console.log('✓ authenticated role created');
    } else {
      console.log('✓ authenticated role already exists');
    }

    // Create anon role if it doesn't exist (used in RLS policies)
    const anonRoleExists = await sql`
      SELECT 1 FROM pg_roles WHERE rolname = 'anon'
    `;
    if (anonRoleExists.length === 0) {
      await sql`CREATE ROLE anon`;
      console.log('✓ anon role created');
    } else {
      console.log('✓ anon role already exists');
    }

    // Note: 'public' role exists by default in PostgreSQL

    if (shouldSyncSchema) {
      await runSchemaSync();
    }

    if (shouldSeed) {
      await runSeed();
    }
  } catch (error) {
    console.error('Failed to setup database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

dbSetup();
