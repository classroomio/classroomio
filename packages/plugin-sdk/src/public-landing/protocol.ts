import type { PublicLandingPageViewModel } from '@cio/utils/validation/organization';
import type { PluginThemeV1 } from '../bridge/protocol';

export const PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION = 1 as const;

export interface PublicLandingRendererContext {
  viewModel: PublicLandingPageViewModel;
  theme: PluginThemeV1;
  isAuthenticated: boolean;
}

export interface PublicLandingRendererReadyMessage {
  type: 'CIO_PUBLIC_LANDING_READY';
  protocolVersion: typeof PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION;
}

export interface PublicLandingRendererHandshakeInit {
  type: 'CIO_PUBLIC_LANDING_HANDSHAKE_INIT';
  protocolVersion: typeof PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION;
  nonce: string;
}

export interface PublicLandingRendererHandshakeAck {
  type: 'CIO_PUBLIC_LANDING_HANDSHAKE_ACK';
  protocolVersion: typeof PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION;
  nonce: string;
}

export interface PublicLandingRendererContextMessage {
  type: 'CIO_PUBLIC_LANDING_CONTEXT';
  context: PublicLandingRendererContext;
}

export interface PublicLandingRendererViewModelMessage {
  type: 'CIO_PUBLIC_LANDING_VIEW_MODEL';
  viewModel: PublicLandingPageViewModel;
}

export interface PublicLandingRendererResizeMessage {
  type: 'CIO_PUBLIC_LANDING_RESIZE';
  height: number;
}

export interface PublicLandingRendererNavigateMessage {
  type: 'CIO_PUBLIC_LANDING_NAVIGATE';
  href: string;
  disposition?: 'self' | 'new-tab';
}

export interface PublicLandingRendererAuthMessage {
  type: 'CIO_PUBLIC_LANDING_AUTH';
}

export function isPublicLandingRendererReadyMessage(message: unknown): message is PublicLandingRendererReadyMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as PublicLandingRendererReadyMessage).type === 'CIO_PUBLIC_LANDING_READY' &&
    (message as PublicLandingRendererReadyMessage).protocolVersion === PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION
  );
}

export function isPublicLandingRendererHandshakeInit(message: unknown): message is PublicLandingRendererHandshakeInit {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as PublicLandingRendererHandshakeInit).type === 'CIO_PUBLIC_LANDING_HANDSHAKE_INIT' &&
    (message as PublicLandingRendererHandshakeInit).protocolVersion === PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION &&
    typeof (message as PublicLandingRendererHandshakeInit).nonce === 'string'
  );
}

export function isPublicLandingRendererHandshakeAck(message: unknown): message is PublicLandingRendererHandshakeAck {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as PublicLandingRendererHandshakeAck).type === 'CIO_PUBLIC_LANDING_HANDSHAKE_ACK' &&
    (message as PublicLandingRendererHandshakeAck).protocolVersion === PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION &&
    typeof (message as PublicLandingRendererHandshakeAck).nonce === 'string'
  );
}

export function isPublicLandingRendererResizeMessage(message: unknown): message is PublicLandingRendererResizeMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as PublicLandingRendererResizeMessage).type === 'CIO_PUBLIC_LANDING_RESIZE' &&
    typeof (message as PublicLandingRendererResizeMessage).height === 'number' &&
    Number.isFinite((message as PublicLandingRendererResizeMessage).height)
  );
}

export function isPublicLandingRendererNavigateMessage(
  message: unknown
): message is PublicLandingRendererNavigateMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as PublicLandingRendererNavigateMessage).type === 'CIO_PUBLIC_LANDING_NAVIGATE' &&
    typeof (message as PublicLandingRendererNavigateMessage).href === 'string' &&
    ((message as PublicLandingRendererNavigateMessage).disposition === undefined ||
      (message as PublicLandingRendererNavigateMessage).disposition === 'self' ||
      (message as PublicLandingRendererNavigateMessage).disposition === 'new-tab')
  );
}

export function isPublicLandingRendererAuthMessage(message: unknown): message is PublicLandingRendererAuthMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as PublicLandingRendererAuthMessage).type === 'CIO_PUBLIC_LANDING_AUTH'
  );
}
