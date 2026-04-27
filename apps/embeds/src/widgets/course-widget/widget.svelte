<script lang="ts">
  import { onMount } from 'svelte';
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import { CourseWidget } from '@cio/ui/custom/widget-layouts';

  const DEFAULT_API_BASE_URL = 'https://api.classroomio.com';

  let { publicKey, apiBaseUrl = DEFAULT_API_BASE_URL }: { publicKey: string; apiBaseUrl?: string } = $props();

  let payload = $state<TWidgetPayload | null>(null);
  let errorMessage = $state('');

  async function loadPayload() {
    try {
      errorMessage = '';

      const response = await fetch(
        `${(apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, '')}/widgets/${publicKey}/payload`
      );
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
