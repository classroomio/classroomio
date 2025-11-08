import * as schema from '@db/schema';

import { admin, anonymous } from 'better-auth/plugins';

import { betterAuth } from 'better-auth';
import { db } from '@db/drizzle';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema
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
  plugins: [admin(), anonymous()]
});
