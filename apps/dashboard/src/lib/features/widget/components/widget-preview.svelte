<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import { CourseWidget, widgetStyles } from '@cio/ui/custom/widget-layouts';
  import { t } from '$lib/utils/functions/translations';

  let { payload = null }: { payload: TWidgetPayload | null } = $props();

  let styleEl: HTMLStyleElement | null = null;

  onMount(() => {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-cio-widget-preview', '');
    styleEl.textContent = widgetStyles;
    document.head.appendChild(styleEl);
  });

  onDestroy(() => {
    if (styleEl?.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  });
</script>

{#if !payload}
  <div class="ui:text-muted-foreground rounded-2xl border border-dashed p-8 text-sm">
    {$t('widgets.preview.empty')}
  </div>
{:else}
  <CourseWidget {payload} />
{/if}
