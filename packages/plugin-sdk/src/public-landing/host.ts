import type { PublicLandingPageViewModel } from './types';
import { DEFAULT_LIGHT_THEME_V1, type PluginThemeV1 } from '../bridge/protocol';
import {
  PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION,
  type PublicLandingRendererContext,
  type PublicLandingRendererHandshakeInit,
  isPublicLandingRendererAuthMessage,
  isPublicLandingRendererHandshakeAck,
  isPublicLandingRendererNavigateMessage,
  isPublicLandingRendererReadyMessage,
  isPublicLandingRendererResizeMessage
} from './protocol';

export interface PublicLandingRendererHostOptions {
  iframe: HTMLIFrameElement;
  viewModel: PublicLandingPageViewModel;
  theme?: PluginThemeV1;
  isAuthenticated: boolean;
  hostWindow?: Window;
  onResize: (height: number) => void;
  onNavigate: (href: string, disposition: 'self' | 'new-tab') => void;
  onAuthentication: () => void;
}

export class PublicLandingRendererHost {
  private channel: MessageChannel | null = null;
  private port: MessagePort | null = null;
  private nonce = crypto.randomUUID();
  private isDestroyed = false;
  private isConnected = false;
  private retryTimer: ReturnType<typeof setInterval> | null = null;
  private retryAttempts = 0;
  private readonly maxRetryAttempts = 100;
  private hostWindow?: Window;

  constructor(private options: PublicLandingRendererHostOptions) {
    this.hostWindow = options.hostWindow ?? (typeof window !== 'undefined' ? window : undefined);
    if (this.hostWindow) {
      this.hostWindow.addEventListener('message', this.handleWindowMessage);
    }
  }

  public startHandshake(): void {
    if (this.isDestroyed || this.isConnected) return;

    this.sendHandshakeAttempt();

    if (!this.retryTimer) {
      this.retryAttempts = 0;
      this.retryTimer = setInterval(() => {
        if (this.isDestroyed || this.isConnected || this.retryAttempts >= this.maxRetryAttempts) {
          if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
          }
          return;
        }

        this.retryAttempts += 1;
        this.sendHandshakeAttempt();
      }, 100);
    }
  }

  public updateViewModel(viewModel: PublicLandingPageViewModel): void {
    this.options.viewModel = viewModel;
    if (!this.isConnected || !this.port) return;

    this.port.postMessage({ type: 'CIO_PUBLIC_LANDING_VIEW_MODEL', viewModel });
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.hostWindow) {
      this.hostWindow.removeEventListener('message', this.handleWindowMessage);
    }
    this.port?.close();
    this.port = null;
    this.channel = null;
  }

  private sendHandshakeAttempt(): void {
    if (this.isDestroyed || this.isConnected || !this.options.iframe.contentWindow) return;

    this.port?.close();
    this.channel = new MessageChannel();
    this.port = this.channel.port1;
    this.port.onmessage = (event) => this.handlePortMessage(event);
    this.nonce = crypto.randomUUID();

    const message: PublicLandingRendererHandshakeInit = {
      type: 'CIO_PUBLIC_LANDING_HANDSHAKE_INIT',
      protocolVersion: PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION,
      nonce: this.nonce
    };
    this.options.iframe.contentWindow.postMessage(message, '*', [this.channel.port2]);
  }

  private handleWindowMessage = (event: MessageEvent): void => {
    if (this.isDestroyed) return;
    if (this.options.iframe.contentWindow && event.source === this.options.iframe.contentWindow) {
      if (isPublicLandingRendererReadyMessage(event.data)) {
        this.isConnected = false;
        this.startHandshake();
      }
    }
  };

  private handlePortMessage(event: MessageEvent): void {
    if (this.isDestroyed) return;

    if (isPublicLandingRendererHandshakeAck(event.data)) {
      if (event.data.nonce !== this.nonce) return;

      this.isConnected = true;
      if (this.retryTimer) {
        clearInterval(this.retryTimer);
        this.retryTimer = null;
      }
      const context: PublicLandingRendererContext = {
        viewModel: this.options.viewModel,
        theme: this.options.theme ?? DEFAULT_LIGHT_THEME_V1,
        isAuthenticated: this.options.isAuthenticated
      };
      this.port?.postMessage({ type: 'CIO_PUBLIC_LANDING_CONTEXT', context });
      return;
    }

    if (isPublicLandingRendererResizeMessage(event.data)) {
      this.options.onResize(event.data.height);
      return;
    }

    if (isPublicLandingRendererNavigateMessage(event.data)) {
      this.options.onNavigate(event.data.href, event.data.disposition ?? 'self');
      return;
    }

    if (isPublicLandingRendererAuthMessage(event.data)) {
      this.options.onAuthentication();
    }
  }
}
