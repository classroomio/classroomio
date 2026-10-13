export const BRIDGE_PROTOCOL_VERSION = '1.0' as const;

export interface PluginContext {
  installationId: string;
  pluginId: string;
  version: string;
  surface?: {
    target: string;
  };
}

export interface BridgeHandshakeInit {
  type: 'CIO_BRIDGE_HANDSHAKE_INIT';
  protocolVersion: typeof BRIDGE_PROTOCOL_VERSION;
  nonce: string;
  origin: string;
}

export interface BridgeHandshakeAck {
  type: 'CIO_BRIDGE_HANDSHAKE_ACK';
  protocolVersion: typeof BRIDGE_PROTOCOL_VERSION;
  nonce: string;
  context: PluginContext;
}

export type BridgeErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_PARAMS'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR'
  | 'NOT_FOUND';

export interface BridgeErrorPayload {
  code: BridgeErrorCode;
  message: string;
}

export interface BridgeRpcRequest<T = unknown> {
  type: 'CIO_RPC_REQUEST';
  id: string;
  action: string;
  payload: T;
}

export interface BridgeRpcResponse<T = unknown> {
  type: 'CIO_RPC_RESPONSE';
  id: string;
  success: boolean;
  data?: T;
  error?: BridgeErrorPayload;
}

export interface BridgeToastPayload {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export interface BridgeModalOpenPayload {
  title: string;
  entrypoint: string;
}

export interface BridgeResizePayload {
  height: number;
}

export interface BridgeNavigationOpenPayload {
  href: string;
}

export type BridgeLaunchCodeRequestPayload = Record<string, never>;

export interface BridgeLaunchCodeResponseData {
  code: string;
  expiresInSeconds: number;
}

export interface BridgeSetDirtyPayload {
  dirty: boolean;
}

export function isBridgeHandshakeInit(message: unknown): message is BridgeHandshakeInit {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as BridgeHandshakeInit).type === 'CIO_BRIDGE_HANDSHAKE_INIT' &&
    (message as BridgeHandshakeInit).protocolVersion === BRIDGE_PROTOCOL_VERSION &&
    typeof (message as BridgeHandshakeInit).nonce === 'string'
  );
}

export function isBridgeRpcResponse(message: unknown): message is BridgeRpcResponse {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as BridgeRpcResponse).type === 'CIO_RPC_RESPONSE' &&
    typeof (message as BridgeRpcResponse).id === 'string' &&
    typeof (message as BridgeRpcResponse).success === 'boolean'
  );
}

export function isBridgeRpcRequest(message: unknown): message is BridgeRpcRequest {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as BridgeRpcRequest).type === 'CIO_RPC_REQUEST' &&
    typeof (message as BridgeRpcRequest).id === 'string' &&
    (message as BridgeRpcRequest).id.length > 0 &&
    typeof (message as BridgeRpcRequest).action === 'string' &&
    (message as BridgeRpcRequest).action.length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyRecord(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length === 0;
}

function isStorageScope(value: unknown): boolean {
  return value === undefined || value === 'organization' || value === 'user' || value === 'owner';
}

export function isValidBridgeRpcPayload(action: string, payload: unknown): boolean {
  if (!isRecord(payload)) return false;

  switch (action) {
    case 'ui:toast':
      return (
        typeof payload.message === 'string' &&
        payload.message.length > 0 &&
        (payload.variant === undefined || ['info', 'success', 'warning', 'error'].includes(String(payload.variant)))
      );
    case 'ui:modal:open':
      return typeof payload.title === 'string' && typeof payload.entrypoint === 'string';
    case 'ui:modal:close':
    case 'auth:requestLaunchCode':
      return isEmptyRecord(payload);
    case 'ui:resize':
      return typeof payload.height === 'number' && Number.isFinite(payload.height);
    case 'navigation:open':
      return typeof payload.href === 'string' && payload.href.length > 0;
    case 'ui:setDirty':
      return typeof payload.dirty === 'boolean';
    case 'ui:storage:get':
    case 'ui:storage:delete':
      return typeof payload.key === 'string' && isStorageScope(payload.scope);
    case 'ui:storage:set':
      return typeof payload.key === 'string' && 'value' in payload && isStorageScope(payload.scope);
    case 'ui:storage:list':
      return typeof payload.namespace === 'string' && isStorageScope(payload.scope);
    case 'ui:preferences:get':
    case 'ui:preferences:delete':
      return typeof payload.key === 'string';
    case 'ui:preferences:set':
      return typeof payload.key === 'string' && 'value' in payload;
    case 'courses:getLatestPublished':
    case 'organization:getProfile':
    case 'lessons:getReadingMetrics':
    case 'lessons:getCompletion':
      return true;
    case 'lessons:setCompletion':
      return typeof payload.complete === 'boolean';
    case 'certificateTemplates:apply':
      return true;
    default:
      return false;
  }
}

export interface BridgeStorageGetPayload {
  key: string;
  namespace?: string;
  scope?: string;
}

export interface BridgeStorageSetPayload {
  key: string;
  value: unknown;
  namespace?: string;
  scope?: string;
}

export interface BridgeStorageDeletePayload {
  key: string;
  namespace?: string;
  scope?: string;
}

export interface BridgeStorageListPayload {
  namespace: string;
  scope?: string;
}

export interface BridgePreferenceGetPayload {
  key: string;
  namespace?: string;
}

export interface BridgePreferenceSetPayload {
  key: string;
  value: unknown;
  namespace?: string;
}

export interface BridgePreferenceDeletePayload {
  key: string;
  namespace?: string;
}

export interface LatestPublishedCourse {
  id: string;
  title: string;
  slug?: string;
}

export interface LessonReadingMetrics {
  estimatedMinutes: number;
  wordCount: number;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
}

export interface PluginThemeTokensV1 {
  background: string;
  surface: string;
  surfaceMuted: string;
  foreground: string;
  foregroundMuted: string;
  border: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  radiusSmall: string;
  radiusMedium: string;
  radiusLarge: string;
  fontSans: string;
  fontMono: string;
}

export interface PluginThemeV1 {
  version: 1;
  colorScheme: 'light' | 'dark';
  direction: 'ltr' | 'rtl';
  locale: string;
  reducedMotion: boolean;
  tokens: PluginThemeTokensV1;
}

export interface BridgeContextInit {
  type: 'CIO_BRIDGE_CONTEXT_INIT';
  context: PluginContext;
  theme?: PluginThemeV1;
}

export interface BridgeThemeChangeMessage {
  type: 'CIO_THEME_CHANGE';
  theme: PluginThemeV1;
}

export const DEFAULT_LIGHT_THEME_V1: PluginThemeV1 = {
  version: 1,
  colorScheme: 'light',
  direction: 'ltr',
  locale: 'en',
  reducedMotion: false,
  tokens: {
    background: '#ffffff',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    foreground: '#0f172a',
    foregroundMuted: '#64748b',
    border: '#e2e8f0',
    accent: '#2563eb',
    accentForeground: '#ffffff',
    destructive: '#ef4444',
    radiusSmall: '4px',
    radiusMedium: '8px',
    radiusLarge: '12px',
    fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  }
};

export const DEFAULT_DARK_THEME_V1: PluginThemeV1 = {
  version: 1,
  colorScheme: 'dark',
  direction: 'ltr',
  locale: 'en',
  reducedMotion: false,
  tokens: {
    background: '#090d16',
    surface: '#111827',
    surfaceMuted: '#1f2937',
    foreground: '#f9fafb',
    foregroundMuted: '#9ca3af',
    border: '#1f2937',
    accent: '#3b82f6',
    accentForeground: '#ffffff',
    destructive: '#f87171',
    radiusSmall: '4px',
    radiusMedium: '8px',
    radiusLarge: '12px',
    fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  }
};

export function applyThemeTokensToRoot(theme: PluginThemeV1): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme.colorScheme);
  root.style.setProperty('color-scheme', theme.colorScheme);
  root.style.setProperty('--cio-background', theme.tokens.background);
  root.style.setProperty('--cio-surface', theme.tokens.surface);
  root.style.setProperty('--cio-surface-muted', theme.tokens.surfaceMuted);
  root.style.setProperty('--cio-foreground', theme.tokens.foreground);
  root.style.setProperty('--cio-foreground-muted', theme.tokens.foregroundMuted);
  root.style.setProperty('--cio-border', theme.tokens.border);
  root.style.setProperty('--cio-accent', theme.tokens.accent);
  root.style.setProperty('--cio-accent-foreground', theme.tokens.accentForeground);
  root.style.setProperty('--cio-destructive', theme.tokens.destructive);
  root.style.setProperty('--cio-radius-sm', theme.tokens.radiusSmall);
  root.style.setProperty('--cio-radius-md', theme.tokens.radiusMedium);
  root.style.setProperty('--cio-radius-lg', theme.tokens.radiusLarge);
  root.style.setProperty('--cio-font-sans', theme.tokens.fontSans);
  root.style.setProperty('--cio-font-mono', theme.tokens.fontMono);
  // Compatibility aliases for pre-v1 official plugin styles. New plugins
  // should use the canonical variables above.
  root.style.setProperty('--cio-color-bg', theme.tokens.background);
  root.style.setProperty('--cio-color-bg-subtle', theme.tokens.surfaceMuted);
  root.style.setProperty('--cio-color-surface', theme.tokens.surface);
  root.style.setProperty('--cio-color-text', theme.tokens.foreground);
  root.style.setProperty('--cio-color-text-secondary', theme.tokens.foregroundMuted);
  root.style.setProperty('--cio-color-border', theme.tokens.border);
  root.style.setProperty('--cio-color-primary', theme.tokens.accent);
}
