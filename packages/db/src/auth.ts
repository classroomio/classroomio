import * as schema from '@db/schema';

import { admin, anonymous } from 'better-auth/plugins';

import bcrypt from 'bcrypt';
import { betterAuth } from 'better-auth';
import { combineAfterHooks } from './auth/hooks';
import { createAuthMiddleware } from 'better-auth/api';
import { db } from '@db/drizzle';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  baseURL: process.env.SERVER_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema
  }),
  emailVerification: {},
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      }
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: 'offline',
      prompt: 'select_account consent'
    }
  },
  trustedOrigins: ['*'],
  advanced: {
    crossSubDomainCookies: {
      enabled: true
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },
  logger: {
    disabled: false,
    disableColors: false,
    level: 'error',
    log: (level, message, ...args) => {
      // Custom logging implementation
      console.log(`[${level}] ${message}`, ...args);
    }
  },
  hooks: {
    after: createAuthMiddleware(combineAfterHooks)
  },
  plugins: [admin(), anonymous()]
});
