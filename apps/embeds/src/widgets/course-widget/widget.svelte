<script lang="ts">
  import { onMount } from 'svelte';
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import { CourseWidget } from '@cio/ui/custom/widget-layouts';

  declare global {
    interface Window {
      CIO?: {
        apiBaseUrl?: string;
      };
    }
  }

  let { publicKey, apiBaseUrl }: { publicKey: string; apiBaseUrl?: string } = $props();

  let payload = $state<TWidgetPayload | null>(null);
  let errorMessage = $state('');

  function resolveApiBaseUrl(): string {
    if (apiBaseUrl) {
      return apiBaseUrl.replace(/\/$/, '');
    }

    const fromWindow = typeof window !== 'undefined' ? window.CIO?.apiBaseUrl : undefined;
    if (fromWindow) {
      return fromWindow.replace(/\/$/, '');
    }

    return '';
  }

  async function loadPayload() {
    try {
      errorMessage = '';

      const apiOrigin = resolveApiBaseUrl();
      if (!apiOrigin) {
        throw new Error('Widget API URL is not configured');
      }

      const response = await fetch(`${apiOrigin}/widgets/${publicKey}/payload`);
      const result = (await response.json()) as { success?: boolean; data?: TWidgetPayload; error?: string };

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Failed to load widget');
      }

      payload = result.data;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to load widget';
    }
  }

  onMount(() => {
    void loadPayload();
  });
</script>

{#if errorMessage}
  <div class="cio-widget-shell cio-widget-error">
    <p>{errorMessage}</p>
  </div>
{:else if !payload}
  <div class="cio-widget-shell cio-widget-loading">
    <div class="cio-widget-spinner" aria-hidden="true"></div>
  </div>
{:else}
  <CourseWidget {payload} />
{/if}
