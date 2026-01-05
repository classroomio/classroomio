/**
 * SSO Types and Interfaces
 */

export type SsoProviderType = 'saml' | 'oidc';

export type SsoProviderName = 'okta' | 'auth0' | 'google_workspace' | 'azure_ad' | 'custom';

export interface SamlConfig {
  idpEntityId?: string;
  idpSsoUrl?: string;
  idpCertificate?: string;
  spEntityId?: string;
  spAcsUrl?: string;
  signatureAlgorithm?: 'sha256' | 'sha512';
  nameIdFormat?: string;
}

export interface OidcConfig {
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scopes?: string[];
}

export interface AttributeMapping {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface SsoConfig {
  id: string;
  organizationId: string;
  providerType: SsoProviderType;
  providerName: string;
  displayName?: string | null;
  enabled: boolean;
  samlConfig?: SamlConfig | null;
  oidcConfig?: OidcConfig | null;
  forceSso: boolean;
  autoProvisionUsers: boolean;
  allowedDomains?: string[] | null;
  defaultRoleId?: number | null;
  attributeMapping?: AttributeMapping | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface SsoSession {
  id: string;
  organizationId: string;
  ssoConfigId: string;
  state: string;
  nonce?: string | null;
  codeVerifier?: string | null;
  redirectUrl?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  errorMessage?: string | null;
  userId?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface SsoUserInfo {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  sub?: string; // Subject identifier from IdP
  rawAttributes?: Record<string, unknown>;
}

export interface SsoInitiateRequest {
  organizationId: string;
  redirectUrl?: string;
}

export interface SsoCallbackRequest {
  state: string;
  code?: string; // For OIDC
  samlResponse?: string; // For SAML
  error?: string;
  errorDescription?: string;
}

export interface SsoInitiateResponse {
  redirectUrl: string;
  state: string;
}

// Provider-specific configurations for well-known providers
export const PROVIDER_CONFIGS: Record<SsoProviderName, {
  displayName: string;
  defaultScopes?: string[];
  discoveryEndpoint?: (domain: string) => string;
}> = {
  okta: {
    displayName: 'Okta',
    defaultScopes: ['openid', 'profile', 'email'],
    discoveryEndpoint: (domain) => `https://${domain}/.well-known/openid-configuration`
  },
  auth0: {
    displayName: 'Auth0',
    defaultScopes: ['openid', 'profile', 'email'],
    discoveryEndpoint: (domain) => `https://${domain}/.well-known/openid-configuration`
  },
  google_workspace: {
    displayName: 'Google Workspace',
    defaultScopes: ['openid', 'profile', 'email'],
    discoveryEndpoint: () => 'https://accounts.google.com/.well-known/openid-configuration'
  },
  azure_ad: {
    displayName: 'Microsoft Entra ID',
    defaultScopes: ['openid', 'profile', 'email'],
    discoveryEndpoint: (tenant) => `https://login.microsoftonline.com/${tenant}/v2.0/.well-known/openid-configuration`
  },
  custom: {
    displayName: 'Custom SSO Provider'
  }
};
