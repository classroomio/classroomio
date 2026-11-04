<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { resolveCurrentHostTheme } from '$features/plugins/utils/theme';
  import { sanitizePublicLandingHref, type PublicLandingPageViewModel } from '@cio/utils/validation/organization';

  interface Props {
    srcUrl: string;
    viewModel: PublicLandingPageViewModel;
    title?: string;
    className?: string;
    minHeight?: number;
    maxHeight?: number;
    onNavigate?: (href: string, disposition?: 'self' | 'new-tab') => void;
    onAuthAction?: () => void;
  }

  let {
    srcUrl,
    viewModel,
    title = 'Academy Landing Page',
    className = 'w-full border-0 transition-[height] duration-200 ease-out',
    minHeight = 700,
    maxHeight = 15000,
    onNavigate,
    onAuthAction
  }: Props = $props();

  let iframeElement = $state<HTMLIFrameElement | null>(null);
  let frameHeight = $state<number>(minHeight);
  let isHandshakeComplete = $state(false);

  function sendToFrame(message: unknown) {
    if (!iframeElement?.contentWindow) return;

    iframeElement.contentWindow.postMessage(message, '*');
  }

  function handleNavigation(rawHref: unknown, disposition?: string) {
    const sanitizedHref = sanitizePublicLandingHref(rawHref, '#');
    if (sanitizedHref === '#') return;

    const targetDisposition = disposition === 'new-tab' ? 'new-tab' : 'self';
    if (onNavigate) {
      onNavigate(sanitizedHref, targetDisposition);
      return;
    }

    const isExternal =
      sanitizedHref.startsWith('http://') ||
      sanitizedHref.startsWith('https://') ||
      sanitizedHref.startsWith('mailto:') ||
      sanitizedHref.startsWith('tel:');

    if (targetDisposition === 'new-tab' || isExternal) {
      window.open(sanitizedHref, '_blank', 'noopener,noreferrer');
      return;
    }

    void goto(resolve(sanitizedHref, {}));
  }

  function handleMessage(event: MessageEvent) {
    if (event.source !== iframeElement?.contentWindow) return;

    const data = event.data;
    if (typeof data !== 'object' || data === null) return;

    if (data.type === 'CIO_BRIDGE_HANDSHAKE_INIT') {
      isHandshakeComplete = true;
      const currentHostTheme = resolveCurrentHostTheme();

      sendToFrame({
        type: 'CIO_BRIDGE_HANDSHAKE_ACK',
        protocolVersion: '1.0',
        nonce: data.nonce,
        context: {
          theme: currentHostTheme,
          viewModel
        }
      });

      sendToFrame({
        type: 'LANDING_PAGE_PROPS_UPDATE',
        viewModel
      });
      return;
    }

    if (data.type === 'CIO_BRIDGE_RESIZE' || data.action === 'landing-page:resize') {
      const requestedHeight = Number(data.height ?? data.payload?.height);
      if (Number.isFinite(requestedHeight) && requestedHeight > 0) {
        frameHeight = Math.max(minHeight, Math.min(maxHeight, requestedHeight));
      }
      return;
    }

    if (data.action === 'landing-page:navigate' || data.type === 'LANDING_PAGE_NAVIGATE') {
      const payload = data.payload ?? data.data ?? data;
      handleNavigation(payload.href, payload.disposition);
      return;
    }

    if (data.action === 'landing-page:auth' || data.type === 'LANDING_PAGE_AUTH') {
      if (onAuthAction) {
        onAuthAction();
        return;
      }

      void goto(resolve('/login', {}));
      return;
    }
  }

  $effect(() => {
    if (!isHandshakeComplete) return;

    sendToFrame({
      type: 'LANDING_PAGE_PROPS_UPDATE',
      viewModel
    });
  });

  onMount(() => {
    window.addEventListener('message', handleMessage);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage);
    }
  });
</script>

<iframe
  bind:this={iframeElement}
  src={srcUrl}
  {title}
  class={className}
  style="height: {frameHeight}px; width: 100%; border: 0; display: block;"
  sandbox="allow-scripts allow-forms allow-same-origin"
  loading="eager"
></iframe>
