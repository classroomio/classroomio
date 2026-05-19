/**
 * One-off migration: copies `auth.users` + identities into Better Auth `"user"` and `account`.
 *
 * Optional reset: when `RESET_BETTER_AUTH_BEFORE_SUPABASE_MIGRATE=1`, clears Better Auth targets
 * in a transaction (see `resetBetterAuthTables`) before re-import.
 *
 * Optional backfill: when `BACKFILL_AUTH_ACCOUNTS_FROM_SUPABASE=1`, only processes Supabase users
 * that already exist in `"user"` but have no rows in `account`, and creates missing account rows
 * from `auth.identities` (does not create or update `"user"` rows). Incompatible with reset;
 * reset is skipped if both flags are set (with a warning).
 */

import 'dotenv/config';

import { admin, anonymous } from 'better-auth/plugins';

import { Pool } from 'pg';
import { betterAuth } from 'better-auth';

const RESET_FLAG = process.env.RESET_BETTER_AUTH_BEFORE_SUPABASE_MIGRATE === '1';
const BACKFILL_ACCOUNTS_ONLY = process.env.BACKFILL_AUTH_ACCOUNTS_FROM_SUPABASE === '1';

console.log('RESET_FLAG', RESET_FLAG);
console.log('BACKFILL_AUTH_ACCOUNTS_FROM_SUPABASE', BACKFILL_ACCOUNTS_ONLY);

if (RESET_FLAG && BACKFILL_ACCOUNTS_ONLY) {
  console.warn(
    'Both RESET_BETTER_AUTH_BEFORE_SUPABASE_MIGRATE and BACKFILL_AUTH_ACCOUNTS_FROM_SUPABASE are set; skipping reset and running account backfill only.'
  );
}

async function resetBetterAuthTables(pool: Pool) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE analytics_login_events');
    await client.query('ALTER TABLE profile DROP CONSTRAINT IF EXISTS profile_id_fkey');
    await client.query('TRUNCATE TABLE verification');
    await client.query('DELETE FROM "user"');
    await client.query('COMMIT');
    console.log(
      'Reset complete: truncated analytics_login_events and verification; dropped profile_id_fkey; deleted all \"user\" rows (account/session cascade).'
    );
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('resetBetterAuthTables error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function restoreProfileUserFkey(pool: Pool) {
  console.log('restoreProfileUserFkey');
  const client = await pool.connect();

  try {
    const orphanResult = await client.query(`
      SELECT COUNT(*)::bigint AS cnt
      FROM profile p
      WHERE NOT EXISTS (
        SELECT 1
        FROM "user" u
        WHERE u.id = p.id
      )
    `);
    const orphanCount = Number(orphanResult.rows[0]?.cnt ?? 0);

    if (orphanCount > 0) {
      throw new Error(
        `Cannot re-add profile_id_fkey: ${orphanCount} profile row(s) have no matching \"user\". Remove orphan profiles or create missing users before re-running.`
      );
    }

    try {
      await client.query(`
        ALTER TABLE profile
        ADD CONSTRAINT profile_id_fkey FOREIGN KEY (id) REFERENCES "user"(id)
      `);
      console.log('Restored constraint profile_id_fkey on profile(id) -> \"user\"(id).');
    } catch (addConstraintError: unknown) {
      const pgError = addConstraintError as { code?: string; message?: string };

      // Avoid failing if FK already exists from a retry or interrupted run

      if (pgError.code === '42710' || pgError.message?.includes('already exists')) {
        console.warn('profile_id_fkey already present; skipping ADD CONSTRAINT.', pgError.message);

        return;
      }

      throw addConstraintError;
    }
  } finally {
    client.release();
  }
}

// We create a custom betterAuth here because this code works well with pg
const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL
  }),
  emailVerification: {},
  emailAndPassword: {
    enabled: true
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  },
  plugins: [
    admin({
      schema: {
        user: {
          fields: {
            banReason: 'ban_reason',
            banExpires: 'ban_expires'
          }
        },
        session: {
          fields: {
            impersonatedBy: 'impersonated_by'
          }
        }
      }
    }),
    anonymous({
      schema: {
        user: {
          fields: {
            isAnonymous: 'is_anonymous'
          }
        }
      }
    })
  ],

  user: {
    modelName: 'user',
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  account: {
    modelName: 'account',
    fields: {
      userId: 'user_id',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      accountId: 'account_id',
      providerId: 'provider_id'
    }
  }
});
interface UserAppMetadata {
  /**
   * The first provider that the user used to sign up with.
   */
  provider?: string;
  /**
   * A list of all providers that the user has linked to their account.
   */
  providers?: string[];
  [key: string]: any;
}

interface UserMetadata {
  [key: string]: any;
}

type SupabaseUser = {
  id: string;
  app_metadata: UserAppMetadata;
  user_metadata: UserMetadata;
  aud: string;
  confirmation_sent_at?: string;
  recovery_sent_at?: string;
  email_change_sent_at?: string;
  new_email?: string;
  new_phone?: string;
  invited_at?: string;
  action_link?: string;
  email?: string;
  phone?: string;
  created_at: string;
  confirmed_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  role?: string;
  updated_at?: string;
  is_anonymous?: boolean;
  is_sso_user?: boolean;
  deleted_at?: string;
  banned_until?: string;
};
type User = SupabaseUser & {
  is_super_admin: boolean;
  raw_user_meta_data: {
    avatar_url: string;
  };
  encrypted_password: string;
  email_confirmed_at: string;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
  profile_fullname: string;
  identities:
    | {
        id: string; // auth.identities.id (UUID) - use as account.id so DB accepts it
        provider: string;
        identity_data: {
          sub: string;
          email: string;
        };
        created_at: string;
        updated_at: string;
      }[]
    | string;
};

function parseIdentities(value: User['identities']) {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value as string);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const migrateFromSupabase = async () => {
  const ctx = await auth.$context;
  const db = ctx.options.database as Pool;

  const effectiveReset = RESET_FLAG && !BACKFILL_ACCOUNTS_ONLY;

  if (effectiveReset) {
    await resetBetterAuthTables(db);
  }

  const migrationWhere = `
  WHERE NOT EXISTS (
    SELECT 1
    FROM "user" existing_user
    WHERE existing_user.id = u.id
  )
`;

  const backfillAccountsWhere = `
  INNER JOIN "user" existing_ba_user ON existing_ba_user.id = u.id
  WHERE NOT EXISTS (
    SELECT 1
    FROM account a
    WHERE a.user_id = u.id
  )
`;

  const usersQuery = `
  SELECT
    u.*,
    COALESCE(
      json_agg(
        i.* ORDER BY i.id
      ) FILTER (WHERE i.id IS NOT NULL),
      '[]'::json
    ) as identities,
    p.fullname as profile_fullname -- Select fullname from public.profile
  FROM auth.users u
  LEFT JOIN auth.identities i ON u.id = i.user_id
  LEFT JOIN public.profile p ON u.id = p.id -- LEFT JOIN with public.profile
  ${BACKFILL_ACCOUNTS_ONLY ? backfillAccountsWhere : migrationWhere}
  GROUP BY u.id, p.fullname
`;

  const users = await db.query(usersQuery).then((res: { rows: User[] }) => res.rows);

  console.log(
    BACKFILL_ACCOUNTS_ONLY
      ? 'users needing account backfill (have "user", no account rows)'
      : 'users to migrate (not yet in "user")',
    users.length
  );

  for (const user of users) {
    if (!user.email) {
      continue;
    }
    if (!BACKFILL_ACCOUNTS_ONLY) {
      const userName = user.profile_fullname || user.email;
      console.log('inserting user', user.email);

      try {
        await ctx.adapter.create({
          model: 'user',
          forceAllowId: true,
          data: {
            id: user.id,
            email: user.email,
            name: userName,
            role: user.is_super_admin ? 'admin' : user.role,
            emailVerified: !!user.email_confirmed_at,
            image: user.raw_user_meta_data?.avatar_url || '',
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
          }
        });
      } catch (createUserError) {
        console.error('create user failed, skipping identities', user.email, createUserError);
        continue;
      }
    } else {
      console.log('backfilling accounts only for', user.email);
    }

    const identities = parseIdentities(user.identities);

    for (const identity of identities) {
      const existingAccounts = await ctx.internalAdapter.findAccounts(user.id);

      if (identity.provider === 'email') {
        console.log('email provider');
        const hasCredential = existingAccounts.find((accountRow) => accountRow.providerId === 'credential');
        console.log('hasCredential', hasCredential);
        if (!hasCredential) {
          await ctx.adapter
            .create({
              model: 'account',
              forceAllowId: true,
              data: {
                id: identity.id,
                userId: user.id,
                providerId: 'credential',
                accountId: user.id,
                password: user.encrypted_password,
                createdAt: new Date(user.created_at),
                updatedAt: new Date(user.updated_at)
              }
            })
            .catch((e) => {
              console.log('catch error', e);
            });
        }
      }
      const supportedProviders = Object.keys(ctx.options.socialProviders || {});
      if (supportedProviders.includes(identity.provider)) {
        const hasAccount = existingAccounts.find((accountRow) => accountRow.providerId === identity.provider);
        if (!hasAccount) {
          await ctx.adapter.create({
            model: 'account',
            forceAllowId: true,
            data: {
              id: identity.id,
              userId: user.id,
              providerId: identity.provider,
              accountId: identity.identity_data?.sub,
              createdAt: new Date(identity.created_at ?? user.created_at),
              updatedAt: new Date(identity.updated_at ?? user.updated_at)
            }
          });
        }
      }
    }
  }

  if (effectiveReset) {
    await restoreProfileUserFkey(db);
  }
};

migrateFromSupabase().catch((migrationError) => {
  console.error('migrateFromSupabase failed:', migrationError);
  process.exitCode = 1;
});
