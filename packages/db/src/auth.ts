import * as CONSTANTS from './constants';
import * as schema from '@db/schema';

import { admin, anonymous } from 'better-auth/plugins';
import { sendChangeEmailConfirmation, sendVerificationEmail } from './auth/email-verification';

import { betterAuth } from 'better-auth/minimal';
import { createProfileHook } from './auth/hooks/create-profile';
import { db } from '@db/drizzle';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { config as emailAndPassword } from './auth/email-password';
import { syncUserWithProfile } from './auth/hooks/sync-user';

export const auth = betterAuth({
  baseURL: CONSTANTS.BASE_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema
    // debugLogs: true
  }),
  emailAndPassword: emailAndPassword,
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation
    }
  },
  emailVerification: {
    enabled: true,
    sendVerificationEmail
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: 'offline',
      prompt: 'select_account consent'
    }
  },
  trustedOrigins: CONSTANTS.TRUSTED_ORIGINS,
  advanced: {
    cookiePrefix: 'classroomio',
    crossSubDomainCookies: {
      enabled: true
    },
    database: {
      generateId: false
    }
  },
  account: {
    storeAccountCookie: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 // 1 hour
    }
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createProfileHook(user);
        }
      },
      update: {
        after: async (user) => {
          console.log('update user', user);
          await syncUserWithProfile(user);
        }
      }
    }
  },
  plugins: [admin(), anonymous()]
});
