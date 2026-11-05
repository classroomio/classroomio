import { describe, expect, it } from 'vitest';
import { PublicLandingRendererHost } from '../src/public-landing/host';
import type { PublicLandingPageViewModel } from '../src/public-landing';

const viewModel: PublicLandingPageViewModel = {
  theme: 'minimal',
  templateId: 'minimal',
  locale: 'en',
  organization: {
    id: 'org-1',
    name: 'Acme Academy',
    siteName: 'acme'
  },
  hero: {
    heading: 'Learn with Acme'
  },
  courses: [],
  hasMoreCourses: false
};

function waitForMessage(port: MessagePort): Promise<unknown> {
  return new Promise((resolve) => {
    port.onmessage = (event) => resolve(event.data);
  });
}

describe('Public landing renderer bridge', () => {
  it('uses a nonce-bound MessagePort for public renderer capabilities', async () => {
    let rendererPort: MessagePort | null = null;
    let handshake: { nonce: string } | null = null;
    const iframe = {
      contentWindow: {
        postMessage: (message: { nonce: string }, _origin: string, ports: MessagePort[]) => {
          handshake = message;
          rendererPort = ports[0] ?? null;
        }
      }
    } as unknown as HTMLIFrameElement;
    const requests: string[] = [];
    const host = new PublicLandingRendererHost({
      iframe,
      viewModel,
      isAuthenticated: false,
      onResize: (height) => requests.push(`resize:${height}`),
      onNavigate: (href, disposition) => requests.push(`navigate:${href}:${disposition}`),
      onAuthentication: () => requests.push('auth')
    });

    host.startHandshake();
    expect(handshake).not.toBeNull();
    expect(rendererPort).not.toBeNull();

    const contextMessage = waitForMessage(rendererPort!);
    rendererPort!.postMessage({
      type: 'CIO_PUBLIC_LANDING_HANDSHAKE_ACK',
      protocolVersion: 1,
      nonce: handshake!.nonce
    });

    await expect(contextMessage).resolves.toMatchObject({
      type: 'CIO_PUBLIC_LANDING_CONTEXT',
      context: { viewModel, isAuthenticated: false }
    });

    rendererPort!.postMessage({ type: 'CIO_PUBLIC_LANDING_RESIZE', height: 720 });
    rendererPort!.postMessage({ type: 'CIO_PUBLIC_LANDING_NAVIGATE', href: '/courses', disposition: 'self' });
    rendererPort!.postMessage({ type: 'CIO_PUBLIC_LANDING_AUTH' });
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(requests).toEqual(['resize:720', 'navigate:/courses:self', 'auth']);
    host.destroy();
  });

  it('rejects a renderer handshake with a different nonce', async () => {
    let rendererPort: MessagePort | null = null;
    const iframe = {
      contentWindow: {
        postMessage: (_message: unknown, _origin: string, ports: MessagePort[]) => {
          rendererPort = ports[0] ?? null;
        }
      }
    } as unknown as HTMLIFrameElement;
    const host = new PublicLandingRendererHost({
      iframe,
      viewModel,
      isAuthenticated: false,
      onResize: () => {},
      onNavigate: () => {},
      onAuthentication: () => {}
    });
    const receivedMessages: unknown[] = [];

    host.startHandshake();
    rendererPort!.onmessage = (event) => receivedMessages.push(event.data);
    rendererPort!.postMessage({
      type: 'CIO_PUBLIC_LANDING_HANDSHAKE_ACK',
      protocolVersion: 1,
      nonce: 'different-nonce'
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(receivedMessages).toEqual([]);
    host.destroy();
  });

  it('retries handshake until an acknowledgment is received', async () => {
    let handshakeAttempts = 0;
    let latestPort: MessagePort | null = null;
    let latestHandshake: { nonce: string } | null = null;

    const iframe = {
      contentWindow: {
        postMessage: (message: { nonce: string }, _origin: string, ports: MessagePort[]) => {
          handshakeAttempts += 1;
          latestHandshake = message;
          latestPort = ports[0] ?? null;
        }
      }
    } as unknown as HTMLIFrameElement;

    const host = new PublicLandingRendererHost({
      iframe,
      viewModel,
      isAuthenticated: false,
      onResize: () => {},
      onNavigate: () => {},
      onAuthentication: () => {}
    });

    host.startHandshake();
    expect(handshakeAttempts).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(handshakeAttempts).toBeGreaterThanOrEqual(2);

    const contextPromise = waitForMessage(latestPort!);
    latestPort!.postMessage({
      type: 'CIO_PUBLIC_LANDING_HANDSHAKE_ACK',
      protocolVersion: 1,
      nonce: latestHandshake!.nonce
    });

    await expect(contextPromise).resolves.toMatchObject({
      type: 'CIO_PUBLIC_LANDING_CONTEXT'
    });

    const attemptsAfterAck = handshakeAttempts;
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(handshakeAttempts).toBe(attemptsAfterAck);

    host.destroy();
  });

  it('triggers handshake on ready announcement from renderer window', async () => {
    let handshake: { nonce: string } | null = null;
    let rendererPort: MessagePort | null = null;

    const mockContentWindow = {} as Window;
    const iframe = {
      contentWindow: mockContentWindow
    } as unknown as HTMLIFrameElement;

    (mockContentWindow as unknown as { postMessage: unknown }).postMessage = (
      message: { nonce: string },
      _origin: string,
      ports: MessagePort[]
    ) => {
      handshake = message;
      rendererPort = ports[0] ?? null;
    };

    const mockHostWindow = new EventTarget() as unknown as Window;
    const host = new PublicLandingRendererHost({
      iframe,
      viewModel,
      isAuthenticated: false,
      hostWindow: mockHostWindow,
      onResize: () => {},
      onNavigate: () => {},
      onAuthentication: () => {}
    });

    const event = new Event('message') as MessageEvent;
    Object.defineProperty(event, 'data', {
      value: { type: 'CIO_PUBLIC_LANDING_READY', protocolVersion: 1 }
    });
    Object.defineProperty(event, 'source', {
      value: mockContentWindow
    });
    mockHostWindow.dispatchEvent(event);

    expect(handshake).not.toBeNull();
    expect(rendererPort).not.toBeNull();

    host.destroy();
  });
});
