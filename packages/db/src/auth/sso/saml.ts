/**
 * SAML 2.0 SSO Implementation
 * Supports: Okta, Azure AD, OneLogin, and custom SAML providers
 * 
 * Note: For full SAML support, you may want to use a library like 'saml2-js' or '@node-saml/node-saml'
 * This implementation provides the basic structure and can be extended with those libraries.
 */

import crypto from 'crypto';
import type { SamlConfig, SsoConfig, SsoUserInfo, AttributeMapping } from './types';
import * as queries from './queries';

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate SAML AuthnRequest ID
 */
function generateRequestId(): string {
  return `_${crypto.randomUUID()}`;
}

/**
 * Get current timestamp in SAML format
 */
function getSamlTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Build SAML AuthnRequest XML
 */
function buildAuthnRequest(
  requestId: string,
  issuer: string,
  acsUrl: string,
  destination: string,
  nameIdFormat?: string
): string {
  const timestamp = getSamlTimestamp();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${timestamp}"
  Destination="${destination}"
  AssertionConsumerServiceURL="${acsUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${issuer}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="${nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'}"
    AllowCreate="true"/>
</samlp:AuthnRequest>`;
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

  const spEntityId = samlConfig.spEntityId || callbackUrl.replace(/\/callback.*$/, '');
  const acsUrl = samlConfig.spAcsUrl || callbackUrl;

  // Generate state and request ID
  const state = generateRandomString(32);
  const requestId = generateRequestId();

  // Store session for callback verification
  await queries.createSsoSession({
    organizationId: ssoConfig.organizationId,
    ssoConfigId: ssoConfig.id,
    state,
    nonce: requestId, // Store request ID as nonce for validation
    redirectUrl: redirectAfterAuth,
    expiresInMinutes: 10
  });

  // Build AuthnRequest
  const authnRequest = buildAuthnRequest(
    requestId,
    spEntityId,
    acsUrl,
    samlConfig.idpSsoUrl,
    samlConfig.nameIdFormat
  );

  // Encode for redirect binding
  const encodedRequest = Buffer.from(authnRequest).toString('base64');
  
  // Build redirect URL
  const params = new URLSearchParams({
    SAMLRequest: encodedRequest,
    RelayState: state
  });

  const redirectUrl = `${samlConfig.idpSsoUrl}?${params.toString()}`;

  return { redirectUrl, state };
}

/**
 * Handle SAML callback - parse and validate SAML response
 * 
 * IMPORTANT: This is a simplified implementation. For production use,
 * you should use a proper SAML library like '@node-saml/node-saml' that handles:
 * - XML signature validation
 * - Certificate validation
 * - Assertion decryption
 * - Replay attack prevention
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
    // Decode SAML response
    const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8');
    
    // Parse user info from SAML response
    // In production, use a proper SAML library for validation
    const userInfo = parseSamlResponse(decodedResponse, ssoConfig.attributeMapping);

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
 * Parse SAML response and extract user info
 * 
 * IMPORTANT: This is a basic XML parser. For production use,
 * implement proper SAML response validation including signature verification.
 */
function parseSamlResponse(
  xmlResponse: string,
  attributeMapping?: AttributeMapping | null
): SsoUserInfo {
  // Basic XML parsing - in production use a proper XML/SAML parser
  const mapping = attributeMapping || {
    email: 'email',
    name: 'name',
    firstName: 'given_name',
    lastName: 'family_name'
  };

  // Extract NameID (usually email)
  const nameIdMatch = xmlResponse.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
  const nameId = nameIdMatch ? nameIdMatch[1] : undefined;

  // Extract attributes
  const attributes: Record<string, string> = {};
  
  // Match attribute statements
  const attributeRegex = /<saml:Attribute[^>]*Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>[\s\S]*?<\/saml:Attribute>/g;
  let match;
  
  while ((match = attributeRegex.exec(xmlResponse)) !== null) {
    const attrName = match[1];
    const attrValue = match[2];
    
    // Handle common attribute name formats
    const normalizedName = attrName
      .replace(/^http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\//, '')
      .replace(/^http:\/\/schemas\.microsoft\.com\/identity\/claims\//, '')
      .replace(/^urn:oid:/, '');
    
    attributes[normalizedName] = attrValue;
  }

  // Map to user info
  const email = 
    getAttributeValue(attributes, mapping.email) ||
    nameId ||
    attributes['emailaddress'] ||
    attributes['email'];

  if (!email) {
    throw new Error('Email not found in SAML response');
  }

  const firstName = getAttributeValue(attributes, mapping.firstName) || attributes['givenname'];
  const lastName = getAttributeValue(attributes, mapping.lastName) || attributes['surname'];
  const name = 
    getAttributeValue(attributes, mapping.name) ||
    attributes['displayname'] ||
    (firstName && lastName ? `${firstName} ${lastName}` : undefined);

  return {
    email,
    name,
    firstName,
    lastName,
    avatar: mapping.avatar ? getAttributeValue(attributes, mapping.avatar) : undefined,
    sub: nameId,
    rawAttributes: attributes
  };
}

/**
 * Get attribute value by name (case-insensitive)
 */
function getAttributeValue(
  attributes: Record<string, string>,
  key?: string
): string | undefined {
  if (!key) return undefined;
  
  // Try exact match first
  if (attributes[key]) return attributes[key];
  
  // Try case-insensitive match
  const lowerKey = key.toLowerCase();
  for (const [attrKey, attrValue] of Object.entries(attributes)) {
    if (attrKey.toLowerCase() === lowerKey) {
      return attrValue;
    }
  }
  
  return undefined;
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
