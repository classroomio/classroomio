/**
 * SAML 2.0 SSO Implementation
 * Supports: Okta, Azure AD, OneLogin, and custom SAML providers
 * 
 * Uses @node-saml/node-saml for proper SAML handling including:
 * - XML signature validation
 * - Certificate validation
 * - Assertion validation
 * - Replay attack prevention
 */

import crypto from 'crypto';
import { SAML } from '@node-saml/node-saml';
import type { SamlConfig, SsoConfig, SsoUserInfo, AttributeMapping } from './types';
import * as queries from './queries';

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Create a SAML instance with the given configuration
 */
function createSamlInstance(samlConfig: SamlConfig, callbackUrl: string): SAML {
  return new SAML({
    callbackUrl,
    entryPoint: samlConfig.idpSsoUrl,
    issuer: samlConfig.spEntityId || callbackUrl.replace(/\/callback.*$/, ''),
    idpCert: samlConfig.idpCertificate ? formatCertificate(samlConfig.idpCertificate) : undefined,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: false, // Some IdPs only sign assertions
    signatureAlgorithm: samlConfig.signatureAlgorithm === 'sha512' ? 'sha512' : 'sha256',
    identifierFormat: samlConfig.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    validateInResponseTo: 'always',
    requestIdExpirationPeriodMs: 600000, // 10 minutes
    disableRequestedAuthnContext: true // More compatible with various IdPs
  });
}

/**
 * Format certificate string - add headers if missing
 */
function formatCertificate(cert: string): string {
  const cleanCert = cert.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
  return `-----BEGIN CERTIFICATE-----\n${cleanCert.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
}

/**
 * Initiate SAML authentication flow
 */
export async function initiateSamlAuth(
  ssoConfig: SsoConfig,
  callbackUrl: string,
  redirectAfterAuth?: string
): Promise<{ redirectUrl: string; state: string }> {
  if (!ssoConfig.samlConfig) {
    throw new Error('SAML configuration is missing');
  }

  const samlConfig = ssoConfig.samlConfig;
  
  if (!samlConfig.idpSsoUrl) {
    throw new Error('IdP SSO URL is required');
  }

  // Generate state for CSRF protection and session tracking
  const state = generateRandomString(32);

  // Create SAML instance
  const saml = createSamlInstance(samlConfig, callbackUrl);

  // Generate the SAML AuthnRequest URL
  const authResult = await saml.getAuthorizeUrlAsync(state, undefined, {});

  // Store session for callback verification (store the request ID from SAML lib)
  await queries.createSsoSession({
    organizationId: ssoConfig.organizationId,
    ssoConfigId: ssoConfig.id,
    state,
    nonce: state, // Use state as the request tracking ID
    redirectUrl: redirectAfterAuth,
    expiresInMinutes: 10
  });

  return { redirectUrl: authResult, state };
}

/**
 * Handle SAML callback - parse and validate SAML response
 * 
 * Uses @node-saml/node-saml for secure validation including:
 * - XML signature validation
 * - Certificate validation
 * - Assertion validation
 * - Time validation
 */
export async function handleSamlCallback(
  relayState: string,
  samlResponse: string
): Promise<{ userInfo: SsoUserInfo; ssoConfig: SsoConfig; redirectUrl?: string }> {
  // Verify relay state and get session
  const session = await queries.getSsoSessionByState(relayState);
  
  if (!session) {
    throw new Error('Invalid or expired SSO session');
  }

  // Get SSO config
  const ssoConfig = await queries.getSsoConfigById(session.ssoConfigId);
  
  if (!ssoConfig || !ssoConfig.samlConfig) {
    await queries.updateSsoSession(relayState, { status: 'failed', errorMessage: 'SSO configuration not found' });
    throw new Error('SSO configuration not found');
  }

  try {
    // Create SAML instance for validation
    // Note: We need a callback URL for the SAML instance, using a placeholder since we're only validating
    const saml = createSamlInstance(ssoConfig.samlConfig, 'https://placeholder.local/sso/callback');

    // Validate the SAML response - this handles signature validation, time checks, etc.
    const { profile } = await saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
      RelayState: relayState
    });

    if (!profile) {
      throw new Error('No profile returned from SAML response');
    }

    // Map SAML profile to our user info format
    const userInfo = mapSamlProfileToUserInfo(profile, ssoConfig.attributeMapping);

    // Validate email domain if restrictions are set
    if (ssoConfig.allowedDomains?.length) {
      const emailDomain = userInfo.email.split('@')[1];
      if (!ssoConfig.allowedDomains.includes(emailDomain)) {
        await queries.updateSsoSession(relayState, {
          status: 'failed',
          errorMessage: `Email domain ${emailDomain} is not allowed`
        });
        throw new Error(`Email domain ${emailDomain} is not allowed for this organization`);
      }
    }

    // Update session as completed
    await queries.updateSsoSession(relayState, { status: 'completed' });

    return {
      userInfo,
      ssoConfig,
      redirectUrl: session.redirectUrl || undefined
    };
  } catch (error) {
    await queries.updateSsoSession(relayState, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Map SAML profile from node-saml to our SsoUserInfo format
 */
function mapSamlProfileToUserInfo(
  profile: Record<string, unknown>,
  attributeMapping?: AttributeMapping | null
): SsoUserInfo {
  const mapping = attributeMapping || {
    email: 'email',
    name: 'name',
    firstName: 'given_name',
    lastName: 'family_name'
  };

  // node-saml puts the NameID in nameID field
  const nameId = profile.nameID as string | undefined;
  
  // Get email from mapped attribute or common locations
  const email = 
    getProfileValue(profile, mapping.email) ||
    (profile.email as string) ||
    nameId ||
    (profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string);

  if (!email) {
    throw new Error('Email not found in SAML response');
  }

  const firstName = 
    getProfileValue(profile, mapping.firstName) ||
    (profile.givenName as string) ||
    (profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] as string);

  const lastName = 
    getProfileValue(profile, mapping.lastName) ||
    (profile.familyName as string) ||
    (profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] as string);

  const name = 
    getProfileValue(profile, mapping.name) ||
    (profile.displayName as string) ||
    (profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string) ||
    (firstName && lastName ? `${firstName} ${lastName}` : undefined);

  return {
    email,
    name,
    firstName,
    lastName,
    avatar: mapping.avatar ? getProfileValue(profile, mapping.avatar) : undefined,
    sub: nameId,
    rawAttributes: profile as Record<string, unknown>
  };
}

/**
 * Get value from profile object by key
 */
function getProfileValue(profile: Record<string, unknown>, key?: string): string | undefined {
  if (!key) return undefined;
  const value = profile[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Parse SAML IdP metadata XML to extract configuration
 * 
 * This is useful for setting up SSO - users can upload their IdP metadata
 * and we extract the necessary configuration automatically.
 */
export function parseSamlMetadata(metadataXml: string): Partial<SamlConfig> {
  const config: Partial<SamlConfig> = {};

  // Extract EntityID
  const entityIdMatch = metadataXml.match(/entityID="([^"]+)"/);
  if (entityIdMatch) {
    config.idpEntityId = entityIdMatch[1];
  }

  // Extract SSO URL (look for HTTP-Redirect or HTTP-POST binding)
  const ssoUrlMatch = metadataXml.match(
    /<SingleSignOnService[^>]*Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-(?:Redirect|POST)"[^>]*Location="([^"]+)"/
  );
  if (ssoUrlMatch) {
    config.idpSsoUrl = ssoUrlMatch[1];
  }

  // Extract certificate
  const certMatch = metadataXml.match(/<ds:X509Certificate>([^<]+)<\/ds:X509Certificate>/);
  if (certMatch) {
    // Clean up certificate (remove whitespace)
    config.idpCertificate = certMatch[1].replace(/\s/g, '');
  }

  return config;
}
