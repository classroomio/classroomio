/**
 * OIDC (OpenID Connect) SSO Implementation
 * Supports: Auth0, Okta, Google Workspace, Azure AD, and custom OIDC providers
 */

import crypto from 'crypto';
import type { OidcConfig, SsoConfig, SsoUserInfo, AttributeMapping } from './types';
import * as queries from './queries';

interface OidcDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  scopes_supported?: string[];
}

interface OidcTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate PKCE code verifier and challenge
 */
function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return { codeVerifier, codeChallenge };
}

/**
 * Fetch OIDC discovery document
 */
async function fetchDiscoveryDocument(issuerUrl: string): Promise<OidcDiscoveryDocument> {
  const discoveryUrl = issuerUrl.endsWith('/')
    ? `${issuerUrl}.well-known/openid-configuration`
    : `${issuerUrl}/.well-known/openid-configuration`;

  const response = await fetch(discoveryUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch OIDC discovery document: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get OIDC endpoints - either from config or discovery
 */
async function getOidcEndpoints(config: OidcConfig): Promise<{
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}> {
  // If explicit URLs are provided, use them
  if (config.authorizationUrl && config.tokenUrl) {
    return {
      authorizationUrl: config.authorizationUrl,
      tokenUrl: config.tokenUrl,
      userInfoUrl: config.userInfoUrl || ''
    };
  }

  // Otherwise, fetch from discovery document
  if (!config.issuerUrl) {
    throw new Error('Either issuerUrl or explicit endpoint URLs must be provided');
  }

  const discovery = await fetchDiscoveryDocument(config.issuerUrl);
  
  return {
    authorizationUrl: discovery.authorization_endpoint,
    tokenUrl: discovery.token_endpoint,
    userInfoUrl: discovery.userinfo_endpoint
  };
}

/**
 * Initiate OIDC authentication flow
 */
export async function initiateOidcAuth(
  ssoConfig: SsoConfig,
  callbackUrl: string,
  redirectAfterAuth?: string
): Promise<{ redirectUrl: string; state: string }> {
  if (!ssoConfig.oidcConfig) {
    throw new Error('OIDC configuration is missing');
  }

  const oidcConfig = ssoConfig.oidcConfig;
  
  if (!oidcConfig.clientId) {
    throw new Error('OIDC client ID is required');
  }

  const endpoints = await getOidcEndpoints(oidcConfig);
  
  // Generate state, nonce, and PKCE
  const state = generateRandomString(32);
  const nonce = generateRandomString(32);
  const { codeVerifier, codeChallenge } = generatePkce();

  // Store session for callback verification
  await queries.createSsoSession({
    organizationId: ssoConfig.organizationId,
    ssoConfigId: ssoConfig.id,
    state,
    nonce,
    codeVerifier,
    redirectUrl: redirectAfterAuth,
    expiresInMinutes: 10
  });

  // Build authorization URL
  const scopes = oidcConfig.scopes?.join(' ') || 'openid profile email';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: oidcConfig.clientId,
    redirect_uri: callbackUrl,
    scope: scopes,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  const redirectUrl = `${endpoints.authorizationUrl}?${params.toString()}`;

  return { redirectUrl, state };
}

/**
 * Handle OIDC callback - exchange code for tokens and get user info
 */
export async function handleOidcCallback(
  state: string,
  code: string,
  callbackUrl: string
): Promise<{ userInfo: SsoUserInfo; ssoConfig: SsoConfig; redirectUrl?: string }> {
  // Verify state and get session
  const session = await queries.getSsoSessionByState(state);
  
  if (!session) {
    throw new Error('Invalid or expired SSO session');
  }

  // Get SSO config
  const ssoConfig = await queries.getSsoConfigById(session.ssoConfigId);
  
  if (!ssoConfig || !ssoConfig.oidcConfig) {
    await queries.updateSsoSession(state, { status: 'failed', errorMessage: 'SSO configuration not found' });
    throw new Error('SSO configuration not found');
  }

  const oidcConfig = ssoConfig.oidcConfig;
  const endpoints = await getOidcEndpoints(oidcConfig);

  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(
      code,
      callbackUrl,
      oidcConfig.clientId!,
      oidcConfig.clientSecret,
      endpoints.tokenUrl,
      session.codeVerifier!
    );

    // Get user info
    const userInfo = await getUserInfo(
      tokenResponse.access_token,
      endpoints.userInfoUrl,
      ssoConfig.attributeMapping
    );

    // Validate email domain if restrictions are set
    if (ssoConfig.allowedDomains?.length) {
      const emailDomain = userInfo.email.split('@')[1];
      if (!ssoConfig.allowedDomains.includes(emailDomain)) {
        await queries.updateSsoSession(state, {
          status: 'failed',
          errorMessage: `Email domain ${emailDomain} is not allowed`
        });
        throw new Error(`Email domain ${emailDomain} is not allowed for this organization`);
      }
    }

    // Update session as completed
    await queries.updateSsoSession(state, { status: 'completed' });

    return {
      userInfo,
      ssoConfig,
      redirectUrl: session.redirectUrl || undefined
    };
  } catch (error) {
    await queries.updateSsoSession(state, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string | undefined,
  tokenUrl: string,
  codeVerifier: string
): Promise<OidcTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  // Add client secret if provided (some providers require it even with PKCE)
  if (clientSecret) {
    // Use basic auth for client credentials
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch user info from OIDC provider
 */
async function getUserInfo(
  accessToken: string,
  userInfoUrl: string,
  attributeMapping?: AttributeMapping | null
): Promise<SsoUserInfo> {
  const response = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  const rawInfo = await response.json();
  const mapping = attributeMapping || {
    email: 'email',
    name: 'name',
    firstName: 'given_name',
    lastName: 'family_name'
  };

  // Map attributes based on configuration
  const userInfo: SsoUserInfo = {
    email: getNestedValue(rawInfo, mapping.email || 'email'),
    name: getNestedValue(rawInfo, mapping.name || 'name'),
    firstName: getNestedValue(rawInfo, mapping.firstName || 'given_name'),
    lastName: getNestedValue(rawInfo, mapping.lastName || 'family_name'),
    avatar: mapping.avatar ? getNestedValue(rawInfo, mapping.avatar) : rawInfo.picture,
    sub: rawInfo.sub,
    rawAttributes: rawInfo
  };

  if (!userInfo.email) {
    throw new Error('Email not provided by identity provider');
  }

  // If name is not provided, construct from first/last name
  if (!userInfo.name && (userInfo.firstName || userInfo.lastName)) {
    userInfo.name = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ');
  }

  return userInfo;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof value === 'string' ? value : undefined;
}
