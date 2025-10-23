import 'dotenv/config';

import { admin, anonymous } from 'better-auth/plugins';

import { Pool } from 'pg';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { betterAuth } from 'better-auth';

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
  plugins: [admin(), anonymous()],

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
  identities: {
    provider: string;
    identity_data: {
      sub: string;
      email: string;
    };
    created_at: string;
    updated_at: string;
  };
};

const migrateFromSupabase = async () => {
  const ctx = await auth.$context;
  const db = ctx.options.database as Pool;
  const users = await db
    .query(
      `
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
  GROUP BY u.id, p.fullname
`
    )
    .then((res) => res.rows as User[]);

  console.log('users length', users.length);

  for (const user of users) {
    if (!user.email) {
      continue;
    }
    const userName = user.profile_fullname || user.email;
    console.log('inserting user', user.email);

    let shouldContinue = false;
    await ctx.adapter
      .create({
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
      })
      .catch((e) => {
        console.log('catch');
        shouldContinue = true;
      });

    if (shouldContinue) {
      console.log('Continue');
      continue;
    }

    for (const identity of user.identities) {
      const existingAccounts = await ctx.internalAdapter.findAccounts(user.id);

      if (identity.provider === 'email') {
        console.log('email provider', identity);
        const hasCredential = existingAccounts.find((account) => account.providerId === 'credential');
        console.log('hasCredential', hasCredential);
        if (!hasCredential) {
          console.log('doesnt have credentials');
          await ctx.adapter
            .create({
              model: 'account',
              data: {
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
        const hasAccount = existingAccounts.find((account) => account.providerId === identity.provider);
        if (!hasAccount) {
          await ctx.adapter.create({
            model: 'account',
            data: {
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
};

migrateFromSupabase();
