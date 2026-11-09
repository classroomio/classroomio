import 'dotenv/config';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const scriptDir = dirname(fileURLToPath(import.meta.url));
if (!process.env.DATABASE_URL && !process.env.PRIVATE_DATABASE_URL && !process.env.PGBOUNCER_DATABASE_URL) {
  dotenv.config({ path: resolve(scriptDir, '../../.env') });
}

import { ZAPIER_OAUTH_SCOPES } from '@cio/utils/constants/zapier';

import { auth } from '../auth';
import { updateOAuthClientScopes } from '../queries/auth/oauth';

const ZAPIER_LOGO_URI = 'https://cdn.zapier.com/zapier/images/logos/zapier-logomark.png';

function readRedirectUris(): string[] {
  const redirectUris = (process.env.ZAPIER_OAUTH_REDIRECT_URIS ?? '')
    .split(',')
    .map((uri) => uri.trim())
    .filter(Boolean);

  if (redirectUris.length === 0) {
    throw new Error('Set ZAPIER_OAUTH_REDIRECT_URIS to the redirect URI from the Zapier developer platform');
  }

  return redirectUris;
}

type ClientRegistrationResponse = {
  client_id: string;
  client_secret: string;
};

type OAuthRegistrationApi = {
  registerOAuthClient?: (opts: { body: Record<string, unknown> }) => Promise<ClientRegistrationResponse>;
  adminCreateOAuthClient?: (opts: { body: Record<string, unknown> }) => Promise<ClientRegistrationResponse>;
};

async function registerZapierClient() {
  const oauthApi = auth.api as unknown as OAuthRegistrationApi;
  const registerFn = oauthApi.registerOAuthClient ?? oauthApi.adminCreateOAuthClient;

  if (!registerFn) {
    throw new Error('OAuth client registration endpoint not found on auth.api');
  }

  const client = await registerFn({
    body: {
      client_name: 'Zapier',
      client_uri: 'https://zapier.com',
      logo_uri: ZAPIER_LOGO_URI,
      redirect_uris: readRedirectUris(),
      token_endpoint_auth_method: 'client_secret_post',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: ZAPIER_OAUTH_SCOPES.join(' ')
    }
  });

  // Dynamic registration stores every scope this provider supports, ignoring the requested scope.
  const scopesUpdated = await updateOAuthClientScopes(client.client_id, ZAPIER_OAUTH_SCOPES);
  if (!scopesUpdated) {
    throw new Error('Registered OAuth client was not found');
  }

  console.log(`client_id=${client.client_id}`);
  console.log(`client_secret=${client.client_secret}`);
  console.log(`Granted scopes: ${ZAPIER_OAUTH_SCOPES.join(' ')}`);
  console.log(
    'Store both in the Zapier integration env (CLIENT_ID, CLIENT_SECRET). Add client_id to OAUTH_TRUSTED_CLIENT_IDS and ZAPIER_OAUTH_CLIENT_ID.'
  );
}

await registerZapierClient();
process.exit(0);
