<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { isValidIframeMessage } from '../utils/preview-protocol';
  import type { WidgetPreviewParentMessage } from '../utils/preview-protocol';
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import { t } from '$lib/utils/functions/translations';

  let {
    payload = null,
    maxWidth = undefined,
    onSynced
  }: {
    payload: TWidgetPayload | null;
    maxWidth?: number;
    onSynced?: () => void;
  } = $props();

  let iframeElement = $state<HTMLIFrameElement | null>(null);
  let iframeReady = $state(false);
  let iframeError = $state('');
  let iframeHeight = $state(400);
  let readyRetryCount = $state(0);

  const MAX_READY_RETRIES = 3;
  const READY_TIMEOUT_MS = 5000;
  const RETRY_BACKOFF = [1000, 2000, 4000];

  let readyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPayload: TWidgetPayload | null = null;

  /** postMessage uses the structured clone algorithm; Svelte proxies / non-plain objects must be plain JSON first. */
  function clonePayloadForPostMessage(widgetPayload: TWidgetPayload): TWidgetPayload {
    return JSON.parse(JSON.stringify(widgetPayload)) as TWidgetPayload;
  }

  function postToIframe(message: WidgetPreviewParentMessage) {
    if (!iframeElement?.contentWindow) {
      return;
    }

    const targetOrigin = window.location.origin;
    iframeElement.contentWindow.postMessage(message, targetOrigin);
  }

  function sendPayload(widgetPayload: TWidgetPayload) {
    if (!iframeReady) {
      pendingPayload = widgetPayload;
      return;
    }

    const requestId = crypto.randomUUID();
    postToIframe({
      type: 'WIDGET_PREVIEW_RENDER',
      payload: clonePayloadForPostMessage(widgetPayload),
      requestId
    });
  }

  function handleIframeMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) {
      return;
    }

    if (!isValidIframeMessage(event.data)) {
      return;
    }

    const message = event.data;

    if (message.type === 'WIDGET_PREVIEW_READY') {
      iframeReady = true;
      iframeError = '';
      readyRetryCount = 0;

      if (readyTimeoutId) {
        clearTimeout(readyTimeoutId);
        readyTimeoutId = null;
      }

      if (pendingPayload) {
        sendPayload(pendingPayload);
        pendingPayload = null;
      }

      return;
    }

    if (message.type === 'WIDGET_PREVIEW_RENDERED') {
      onSynced?.();
      return;
    }

    if (message.type === 'WIDGET_PREVIEW_ERROR') {
      console.error('[WidgetPreview]', message.error);
      iframeError = message.error;
      return;
    }

    if (message.type === 'WIDGET_PREVIEW_RESIZE') {
      iframeHeight = Math.max(200, message.height + 16);
    }
  }

  function waitForReady() {
    if (iframeReady || readyRetryCount >= MAX_READY_RETRIES) {
      if (!iframeReady) {
        iframeError = t.get('widgets.preview.load_failed');
      }

      return;
    }

    const backoffMs = RETRY_BACKOFF[readyRetryCount] ?? READY_TIMEOUT_MS;
    readyTimeoutId = setTimeout(() => {
      if (iframeReady) {
        return;
      }

      readyRetryCount += 1;
      postToIframe({ type: 'WIDGET_PREVIEW_PING' });
      waitForReady();
    }, backoffMs);
  }

  $effect(() => {
    if (payload) {
      sendPayload(payload);
    }
  });

  onMount(() => {
    window.addEventListener('message', handleIframeMessage);
    waitForReady();
  });

  onDestroy(() => {
    window.removeEventListener('message', handleIframeMessage);

    if (readyTimeoutId) {
      clearTimeout(readyTimeoutId);
    }
  });
</script>

{#if iframeError}
  <div class="ui:text-muted-foreground flex items-center justify-center rounded-2xl border border-dashed p-8 text-sm">
    <p>{iframeError}</p>
  </div>
{:else}
  <div class="overflow-hidden rounded-2xl transition-all" style={maxWidth ? `max-width:${maxWidth}px` : ''}>
    <iframe
      bind:this={iframeElement}
      src="/widget-preview"
      title={$t('widgets.preview.heading')}
      sandbox="allow-scripts allow-same-origin"
      class="w-full border-0"
      style="height:{iframeHeight}px"
    ></iframe>
  </div>
{/if}
