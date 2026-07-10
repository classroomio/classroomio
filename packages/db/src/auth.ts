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
import { syncProfileEmailVerificationFromAuthUser } from './queries/auth/profile';

export { mintLoginLinkToken } from './auth/login-link';

/**
 * Cloud (multi-tenant) only. Routes OAuth/SSO callbacks to the canonical
 * production URL while completing the flow on whichever tenant host the
 * user signed in from (<org>.myclassroomio.com or a BYOD domain).
 *
 * Self-hosted instances proxy browser auth through the dashboard origin, so
 * the OAuth proxy plugin is only needed for cloud tenant/BYOD domains.
 */
function buildOAuthProxyPlugin() {
  if (process.env.PUBLIC_IS_SELFHOSTED === 'true') {
    return [];
  }
  return [oAuthProxy({ productionURL: CONSTANTS.BASE_URL })];
}

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

    return origins;
  },
  advanced: {
    cookiePrefix: 'classroomio',
    // Browser auth is first-party through tenant-router or the dashboard proxy,
    // so cookies should stay host-only on the dashboard/public-site origin.
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
          await syncProfileEmailVerificationFromAuthUser(session.userId);
        }
      },
      update: {
        after: async (session) => {
          await trackLoginHook(session);
          await syncProfileEmailVerificationFromAuthUser(session.userId);
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
    ...buildOAuthProxyPlugin(),
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
