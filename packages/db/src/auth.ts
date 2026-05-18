import * as CONSTANTS from './constants';
import * as schema from '@db/schema';

import { admin, anonymous } from 'better-auth/plugins';
import { customSession } from 'better-auth/plugins/custom-session';
import { sendChangeEmailConfirmation, sendVerificationEmail } from './auth/email-verification';

import { betterAuth } from 'better-auth/minimal';
import { createProfileHook } from './auth/hooks/create-profile';
import { db } from '@db/drizzle';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { config as emailAndPassword } from './auth/email-password';
import { loginLink } from './auth/plugins/login-link';
import { sso } from '@better-auth/sso';
import { syncUserWithProfile } from './auth/hooks/sync-user';
import { tokenExchange } from './auth/plugins/token-exchange';
import { trackLoginHook } from './auth/hooks/track-login';
import { getUserOrgRolesMap } from './queries/organization/organization';

export const auth: ReturnType<typeof betterAuth> = betterAuth({
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
      enabled: true,
      ...(CONSTANTS.AUTH_COOKIE_DOMAIN ? { domain: CONSTANTS.AUTH_COOKIE_DOMAIN } : {})
    },
    database: {
      generateId: false
    }
  },
  account: {
    storeAccountCookie: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
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
          console.log('[auth] databaseHooks.user.create.after: running', { userId: user.id });
          await createProfileHook(user);
        }
      },
      update: {
        after: async (user) => {
          console.log('[auth] databaseHooks.user.update.after: running', { userId: user.id });
          await syncUserWithProfile(user);
        }
      }
    },
    session: {
      create: {
        after: async (session) => {
          await trackLoginHook(session);
        }
      },
      update: {
        after: async (session) => {
          await trackLoginHook(session);
        }
      }
    }
  },
  plugins: [
    admin(),
    anonymous(),
    sso({
      // OIDC providers are registered dynamically per organization
      // via the admin API (auth.api.registerSSOProvider)
    }),
    loginLink(),
    tokenExchange(),
    // Attaches the user's org memberships ({ [orgId]: roleId }) to the session
    // so org-scoped middlewares can authorize without a per-request DB query.
    // Refreshes when the session cookie cache expires (see session.cookieCache.maxAge).
    customSession(async ({ user, session }) => {
      let orgRoles: Record<string, number> = {};
      try {
        if (user?.id) {
          orgRoles = await getUserOrgRolesMap(user.id);
        }
      } catch (error) {
        console.error('customSession: failed to load orgRoles', error);
      }
      return { user, session, orgRoles };
    })
  ]
});
