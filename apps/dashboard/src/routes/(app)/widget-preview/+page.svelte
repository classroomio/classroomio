<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import WidgetPreview from '$features/widget/components/widget-preview.svelte';
  import { isValidParentMessage, isAllowedOrigin } from '$features/widget/utils/preview-protocol';
  import type { WidgetPreviewIframeMessage } from '$features/widget/utils/preview-protocol';
  import type { TWidgetPayload } from '@cio/utils/validation/widget';

  let payload = $state<TWidgetPayload | null>(null);
  let errorMessage = $state('');
  let containerElement = $state<HTMLElement | null>(null);
  let resizeObserver: ResizeObserver | null = null;

  const iframeId = crypto.randomUUID();

  function postToParent(message: WidgetPreviewIframeMessage) {
    if (!window.parent || window.parent === window) {
      return;
    }

    window.parent.postMessage(message, '*');
  }

  function handleMessage(event: MessageEvent) {
    if (!isAllowedOrigin(event.origin)) {
      return;
    }

    if (!isValidParentMessage(event.data)) {
      return;
    }

    const message = event.data;

    if (message.type === 'WIDGET_PREVIEW_PING') {
      postToParent({ type: 'WIDGET_PREVIEW_READY', iframeId, timestamp: Date.now() });
      return;
    }

    if (message.type === 'WIDGET_PREVIEW_RENDER') {
      try {
        payload = message.payload;
        errorMessage = '';

        requestAnimationFrame(() => {
          postToParent({
            type: 'WIDGET_PREVIEW_RENDERED',
            requestId: message.requestId,
            timestamp: Date.now()
          });
        });
      } catch (renderError) {
        errorMessage = renderError instanceof Error ? renderError.message : 'Preview render failed';
        postToParent({
          type: 'WIDGET_PREVIEW_ERROR',
          requestId: message.requestId,
          error: errorMessage,
          timestamp: Date.now()
        });
      }
    }
  }

  function observeResize() {
    if (!containerElement) {
      return;
    }

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        postToParent({
          type: 'WIDGET_PREVIEW_RESIZE',
          height: Math.ceil(entry.contentRect.height)
        });
      }
    });

    resizeObserver.observe(containerElement);
  }

  onMount(() => {
    window.addEventListener('message', handleMessage);
    observeResize();

    postToParent({ type: 'WIDGET_PREVIEW_READY', iframeId, timestamp: Date.now() });
  });

  onDestroy(() => {
    if (!browser) {
      return;
    }

    window.removeEventListener('message', handleMessage);
    resizeObserver?.disconnect();
  });
</script>

<svelte:head>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden;
    }
  </style>
</svelte:head>

<div bind:this={containerElement}>
  {#if errorMessage}
    <div class="p-4 text-sm text-red-600">{errorMessage}</div>
  {:else}
    <WidgetPreview {payload} />
  {/if}
</div>
