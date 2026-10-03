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
      stdio: 'inherit',
      // On Windows, spawning the pnpm.cmd shim requires a shell since Node's
      // CVE-2024-27980 fix (spawning .cmd/.bat without shell throws EINVAL).
      shell: process.platform === 'win32'
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

async function dropAndRecreateSchemas() {
  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('Dropping public and drizzle schemas...');
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    await sql`CREATE SCHEMA public`;
    console.log('✓ Schemas dropped and recreated');
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
    await dropAndRecreateSchemas();
    await runSetupAndSeed();
    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }
}

resetDatabase();
