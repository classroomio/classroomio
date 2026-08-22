/**
 * Bans or unbans a platform user via Better Auth's admin fields on "user"
 * (`banned`, `ban_reason`, `ban_expires`). Banning also revokes all active
 * sessions so the ban takes effect immediately.
 *
 * Usage:
 *   pnpm db:ban-user -- --email user@example.com --reason "ToS violation"                  # dry run (default)
 *   pnpm db:ban-user -- --email user@example.com --reason "ToS violation" --execute        # permanent ban
 *   pnpm db:ban-user -- --email user@example.com --expires "2026-12-31T23:59:59Z" --execute # temporary ban
 *   pnpm db:ban-user -- --email user@example.com --unban --execute                         # lift ban
 */
import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');
const shouldUnban = process.argv.includes('--unban');

function readArg(flag: string): string {
  const flagIndex = process.argv.indexOf(flag);
  const value = flagIndex === -1 ? '' : (process.argv[flagIndex + 1] ?? '');

  return value.trim();
}

const email = readArg('--email').toLowerCase();
const banReason = readArg('--reason');
const banExpiresRaw = readArg('--expires');

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!email) {
  console.error(
    'Usage: pnpm db:ban-user -- --email user@example.com [--reason "..."] [--expires <iso-date>] [--unban] [--execute]'
  );
  process.exit(1);
}

let banExpiresDate: Date | null = null;

if (!shouldUnban && banExpiresRaw) {
  banExpiresDate = new Date(banExpiresRaw);

  if (Number.isNaN(banExpiresDate.getTime())) {
    console.error(`"${banExpiresRaw}" is not a valid date. Use an ISO timestamp, e.g. 2026-12-31T23:59:59Z.`);
    process.exit(1);
  }
}

async function main() {
  const sql = postgres(connectionString);

  try {
    const users = await sql`
      SELECT id, name, email, banned, ban_reason, ban_expires FROM "user" WHERE lower(email) = ${email}
    `;

    if (users.length === 0) {
      console.error(`No user found with email ${email}`);
      process.exit(1);
    }

    const targetUser = users[0];
    console.log(`Found user ${targetUser.id} (${targetUser.name}) <${targetUser.email}>`);
    console.log(
      `Current state: banned=${targetUser.banned}, reason=${JSON.stringify(targetUser.ban_reason)}, expires=${targetUser.ban_expires?.toISOString() ?? 'never'}`
    );

    const sessions = await sql`
      SELECT count(*)::int AS count FROM "session" WHERE user_id = ${targetUser.id}
    `;
    const activeSessionCount = sessions[0].count;

    if (shouldUnban) {
      console.log('');
      console.log('Planned change:');
      console.log(`  user: banned=false, ban_reason=NULL, ban_expires=NULL`);

      if (!shouldExecute) {
        console.log('');
        console.log('Dry run only. Re-run with --execute to apply.');
        return;
      }

      await sql.begin(async (tx) => {
        await tx`
          UPDATE "user"
          SET banned = false, ban_reason = NULL, ban_expires = NULL, updated_at = NOW()
          WHERE id = ${targetUser.id}
        `;
      });

      console.log('');
      console.log(`Done. Ban lifted for ${targetUser.email}.`);
      return;
    }

    if (targetUser.banned) {
      console.log('');
      console.warn('This user is already banned. Re-running will overwrite the reason/expiry.');
    }

    const expiresLabel = banExpiresDate ? banExpiresDate.toISOString() : 'permanent';
    console.log('');
    console.log('Planned changes:');
    console.log(`  user: banned=true, reason=${JSON.stringify(banReason || null)}, expires=${expiresLabel}`);
    console.log(`  session: revoke ${activeSessionCount} active session(s)`);

    if (!shouldExecute) {
      console.log('');
      console.log('Dry run only. Re-run with --execute to apply.');
      return;
    }

    await sql.begin(async (tx) => {
      await tx`
        UPDATE "user"
        SET banned = true, ban_reason = ${banReason || null}, ban_expires = ${banExpiresDate}, updated_at = NOW()
        WHERE id = ${targetUser.id}
      `;
      await tx`
        DELETE FROM "session" WHERE user_id = ${targetUser.id}
      `;
    });

    console.log('');
    console.log(`Done. ${targetUser.email} is banned (${expiresLabel}). Revoked ${activeSessionCount} session(s).`);
  } catch (error) {
    console.error('ban-user error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
