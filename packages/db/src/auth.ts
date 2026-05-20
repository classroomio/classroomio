import * as CONSTANTS from './constants';
import * as schema from '@db/schema';

import { admin, anonymous } from 'better-auth/plugins';
import { sendChangeEmailConfirmation, sendVerificationEmail } from './auth/email-verification';

import { betterAuth } from 'better-auth/minimal';
import { createProfileHook } from './auth/hooks/create-profile';
import { customSession } from 'better-auth/plugins/custom-session';
import { db } from '@db/drizzle';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { config as emailAndPassword } from './auth/email-password';
import { getUserOrgRolesMap } from './queries/organization/organization';
import { loginLink } from './auth/plugins/login-link';
import { oAuthProxy } from 'better-auth/plugins/oauth-proxy';
import { resolveTrustedBrowserOrigin } from './utils';
import { sso } from '@better-auth/sso';
import { syncUserWithProfile } from './auth/hooks/sync-user';
import { tokenExchange } from './auth/plugins/token-exchange';
import { trackLoginHook } from './auth/hooks/track-login';

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
  trustedOrigins: (request) => {
    const origins = [...CONSTANTS.TRUSTED_ORIGINS];
    const originHeader = request?.headers.get('origin');
    const resolved = resolveTrustedBrowserOrigin(originHeader, CONSTANTS.TRUSTED_ORIGINS);

    if (resolved && !origins.includes(resolved)) {
      origins.push(resolved);
    }

    console.log('ba origins', origins);
    return origins;
  },
  advanced: {
    cookiePrefix: 'classroomio',
    crossSubDomainCookies: { enabled: false },
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
        after: async (user, ctx) => {
          console.log('[auth] databaseHooks.user.create.after: running', { userId: user.id, ctx });
          const request =
            (ctx as { context?: { request?: Request }; request?: Request } | undefined)?.context?.request ??
            (ctx as { request?: Request } | undefined)?.request;
          await createProfileHook(user, request);
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
    // Lets OAuth/SSO callbacks land on the canonical production URL
    // (api.classroomio.com) while still completing the flow on the tenant
    // host the user signed in from (<org>.classroomio.school or a BYOD
    // domain). Without this, the state cookie set on the tenant host isn't
    // sent to the api host on the Google redirect → state_security_mismatch.
    oAuthProxy({
      productionURL: CONSTANTS.BASE_URL
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
