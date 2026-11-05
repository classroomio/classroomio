import type { PublicLandingPageViewModel } from '@cio/utils/validation/organization';
import {
  PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION,
  type PublicLandingRendererContext,
  type PublicLandingRendererContextMessage,
  type PublicLandingRendererHandshakeAck,
  type PublicLandingRendererNavigateMessage,
  type PublicLandingRendererReadyMessage,
  type PublicLandingRendererResizeMessage,
  type PublicLandingRendererViewModelMessage,
  isPublicLandingRendererHandshakeInit
} from './protocol';

export interface PublicLandingRendererClientOptions {
  targetWindow?: Window;
}

export class PublicLandingRendererClient {
  private port: MessagePort | null = null;
  private context: PublicLandingRendererContext | null = null;
  private contextPromise: Promise<PublicLandingRendererContext>;
  private resolveContext!: (context: PublicLandingRendererContext) => void;
  private viewModelListeners = new Set<(viewModel: PublicLandingPageViewModel) => void>();
  private isDestroyed = false;
  private targetWindow: Window | null = null;
  private handshakeListener: ((event: MessageEvent) => void) | null = null;
  private readyInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: PublicLandingRendererClientOptions = {}) {
    const targetWindow = options.targetWindow ?? (typeof window === 'undefined' ? null : window);
    this.contextPromise = new Promise<PublicLandingRendererContext>((resolve) => {
      this.resolveContext = resolve;
    });

    if (targetWindow) {
      this.initializeHandshake(targetWindow);
    }
  }

  public getContext(): Promise<PublicLandingRendererContext> {
    return this.contextPromise;
  }

  public onViewModelChange(listener: (viewModel: PublicLandingPageViewModel) => void): () => void {
    this.viewModelListeners.add(listener);
    return () => this.viewModelListeners.delete(listener);
  }

  public resize(height: number): void {
    if (!Number.isFinite(height) || height <= 0) return;

    const message: PublicLandingRendererResizeMessage = {
      type: 'CIO_PUBLIC_LANDING_RESIZE',
      height
    };
    this.port?.postMessage(message);
  }

  public navigate(href: string, disposition?: 'self' | 'new-tab'): void {
    const message: PublicLandingRendererNavigateMessage = {
      type: 'CIO_PUBLIC_LANDING_NAVIGATE',
      href,
      disposition
    };
    this.port?.postMessage(message);
  }

  public requestAuthentication(): void {
    this.port?.postMessage({ type: 'CIO_PUBLIC_LANDING_AUTH' });
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.readyInterval) {
      clearInterval(this.readyInterval);
      this.readyInterval = null;
    }
    if (this.targetWindow && this.handshakeListener) {
      this.targetWindow.removeEventListener('message', this.handshakeListener);
      this.handshakeListener = null;
    }
    this.port?.close();
    this.port = null;
    this.viewModelListeners.clear();
  }

  private initializeHandshake(targetWindow: Window): void {
    this.targetWindow = targetWindow;
    this.handshakeListener = (event: MessageEvent) => {
      if (event.source !== targetWindow.parent || !isPublicLandingRendererHandshakeInit(event.data)) return;

      const port = event.ports[0];
      if (!port) return;

      if (this.readyInterval) {
        clearInterval(this.readyInterval);
        this.readyInterval = null;
      }

      this.port?.close();
      this.port = port;
      port.onmessage = (portEvent) => this.handlePortMessage(portEvent);

      const acknowledgement: PublicLandingRendererHandshakeAck = {
        type: 'CIO_PUBLIC_LANDING_HANDSHAKE_ACK',
        protocolVersion: PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION,
        nonce: event.data.nonce
      };
      port.postMessage(acknowledgement);
    };

    targetWindow.addEventListener('message', this.handshakeListener);

    const sendReady = () => {
      if (this.isDestroyed || this.context || !targetWindow.parent || targetWindow.parent === targetWindow) {
        if (this.readyInterval) {
          clearInterval(this.readyInterval);
          this.readyInterval = null;
        }
        return;
      }

      const readyMessage: PublicLandingRendererReadyMessage = {
        type: 'CIO_PUBLIC_LANDING_READY',
        protocolVersion: PUBLIC_LANDING_RENDERER_PROTOCOL_VERSION
      };
      targetWindow.parent.postMessage(readyMessage, '*');
    };

    sendReady();
    this.readyInterval = setInterval(sendReady, 100);
  }

  private handlePortMessage(event: MessageEvent): void {
    if (this.isDestroyed || typeof event.data !== 'object' || event.data === null) return;

    const message = event.data as { type?: string };
    if (message.type === 'CIO_PUBLIC_LANDING_CONTEXT') {
      const contextMessage = message as PublicLandingRendererContextMessage;
      this.context = contextMessage.context;
      this.resolveContext(contextMessage.context);
      return;
    }

    if (message.type !== 'CIO_PUBLIC_LANDING_VIEW_MODEL') return;

    const viewModelMessage = message as PublicLandingRendererViewModelMessage;
    if (this.context) {
      this.context = { ...this.context, viewModel: viewModelMessage.viewModel };
    }
    for (const listener of this.viewModelListeners) {
      listener(viewModelMessage.viewModel);
    }
  }
}

export function createPublicLandingRendererClient(
  options?: PublicLandingRendererClientOptions
): PublicLandingRendererClient {
  return new PublicLandingRendererClient(options);
}
