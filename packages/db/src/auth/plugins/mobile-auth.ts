import type { BetterAuthPlugin } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';

import { APP_ORIGIN } from '../../constants';

const SSO_CALLBACK_PATHS = ['/sso/callback', '/sso/saml2/sp/acs'];

/** Mobile flows `@better-auth/expo` does not cover: session handoff after SSO callbacks, and a dashboard `redirectTo` for password reset requests that omit one. */
export function mobileAuth(): BetterAuthPlugin {
  return {
    id: 'mobile-auth',
    hooks: {
      before: [
        {
          matcher: (context) => context.path === '/request-password-reset',
          handler: createAuthMiddleware(async (ctx) => {
            const body = ctx.body as { email?: string; redirectTo?: string } | undefined;
            if (!body || body.redirectTo) return;

            return { context: { body: { ...body, redirectTo: `${APP_ORIGIN}/reset` } } };
          })
        }
      ],
      after: [
        {
          matcher: (context) => SSO_CALLBACK_PATHS.some((path) => context.path?.startsWith(path)),
          handler: createAuthMiddleware(async (ctx) => {
            const headers = ctx.context.responseHeaders;
            const location = headers?.get('location');
            const cookie = headers?.get('set-cookie');
            if (!location || !cookie) return;

            let redirectURL: URL;
            try {
              redirectURL = new URL(location);
            } catch {
              return;
            }

            if (redirectURL.protocol === 'http:' || redirectURL.protocol === 'https:') return;
            if (!ctx.context.isTrustedOrigin(location)) return;

            redirectURL.searchParams.set('cookie', cookie);
            ctx.setHeader('location', redirectURL.toString());
          })
        }
      ]
    }
  };
}
