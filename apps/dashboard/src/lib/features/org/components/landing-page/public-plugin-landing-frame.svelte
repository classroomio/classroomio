<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { PublicLandingRendererHost } from '@classroomio/plugin-sdk';
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
  let bridgeHost: PublicLandingRendererHost | null = null;

  function handleNavigation(rawHref: string, disposition: 'self' | 'new-tab') {
    const sanitizedHref = sanitizePublicLandingHref(rawHref, '#');
    if (sanitizedHref === '#') return;

    if (onNavigate) {
      onNavigate(sanitizedHref, disposition);
      return;
    }

    const isExternal =
      sanitizedHref.startsWith('http://') ||
      sanitizedHref.startsWith('https://') ||
      sanitizedHref.startsWith('mailto:') ||
      sanitizedHref.startsWith('tel:');
    if (disposition === 'new-tab' || isExternal) {
      window.open(sanitizedHref, '_blank', 'noopener,noreferrer');
      return;
    }

    void goto(resolve(sanitizedHref, {}));
  }

  function handleFrameLoad() {
    bridgeHost?.startHandshake();
  }

  $effect(() => {
    bridgeHost?.updateViewModel(viewModel);
  });

  onMount(() => {
    if (!iframeElement) return;

    bridgeHost = new PublicLandingRendererHost({
      iframe: iframeElement,
      viewModel,
      theme: resolveCurrentHostTheme(),
      isAuthenticated: viewModel.navigation?.isAuthenticated ?? false,
      onResize: (height) => {
        frameHeight = Math.max(minHeight, Math.min(maxHeight, height));
      },
      onNavigate: handleNavigation,
      onAuthentication: () => {
        if (onAuthAction) {
          onAuthAction();
          return;
        }

        void goto(resolve('/login', {}));
      }
    });

    bridgeHost.startHandshake();

    return () => bridgeHost?.destroy();
  });
</script>

<iframe
  bind:this={iframeElement}
  src={srcUrl}
  {title}
  class={className}
  style="height: {frameHeight}px; width: 100%; border: 0; display: block;"
  sandbox="allow-scripts"
  loading="eager"
  onload={handleFrameLoad}
></iframe>
