import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
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

    // Add other extensions here as needed
  } catch (error) {
    console.error('Failed to setup extensions:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

dbSetup();
