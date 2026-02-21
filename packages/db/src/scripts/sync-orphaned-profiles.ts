/**
 * Fixes user-related FK violations before `pnpm db push`:
 * 1. Deletes analytics_login_events rows that reference a non-existent user.
 * 2. Creates missing user rows for profiles that have no matching user (orphaned profiles).
 *
 * Usage: pnpm db:sync-orphaned-profiles
 */
import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

async function main() {
  const sql = postgres(connectionString);

  try {
    const deletedEvents = await sql`
      DELETE FROM analytics_login_events
      WHERE user_id NOT IN (SELECT id FROM "user")
      RETURNING id
    `;
    if (deletedEvents.length > 0) {
      console.log(`Removed ${deletedEvents.length} orphaned analytics_login_events row(s).`);
    }

    const orphaned = await sql`
      SELECT p.id, p.fullname, p.email, p.avatar_url, p.created_at, p.updated_at, p.is_email_verified
      FROM profile p
      LEFT JOIN "user" u ON u.id = p.id
      WHERE u.id IS NULL
    `;

    if (orphaned.length === 0) {
      console.log('No orphaned profiles found.');
      console.log('Done. You can run `pnpm db push` again.');
      return;
    }

    console.log(`Found ${orphaned.length} orphaned profile(s). Creating missing user rows...`);

    await sql.begin(async (tx) => {
      for (const p of orphaned) {
        const email = p.email && String(p.email).trim() !== '' ? String(p.email).trim() : `${p.id}@recovered.local`;
        await tx`
          INSERT INTO "user" (
            id,
            name,
            email,
            email_verified,
            image,
            created_at,
            updated_at
          ) VALUES (
            ${p.id},
            ${p.fullname ?? 'Unknown'},
            ${email},
            ${p.is_email_verified ?? false},
            ${p.avatar_url ?? null},
            ${p.created_at ?? new Date()},
            ${p.updated_at ?? new Date()}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        console.log(`  Created user for profile ${p.id} (${p.fullname}, ${email})`);
      }
    });

    console.log('Done. You can run `pnpm db push` again.');
  } catch (error) {
    console.error('sync-orphaned-profiles error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main();
