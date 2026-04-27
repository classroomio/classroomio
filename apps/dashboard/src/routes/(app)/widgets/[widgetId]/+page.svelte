<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { WidgetEditorPage } from '$features/widget/pages';
  import { widgetApi } from '$features/widget/api/widget.svelte';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import type { WidgetDetail } from '$features/widget/utils/types';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';

  let detail = $state<WidgetDetail | null>(null);
  let loadError = $state<string | null>(null);

  $effect(() => {
    const widgetId = page.params.widgetId;
    const orgId = $currentOrg.id;
    if (!widgetId || !orgId) {
      return;
    }

    let cancelled = false;
    detail = null;
    loadError = null;

    void (async () => {
      await widgetApi.getWidget(widgetId);
      if (cancelled) return;
      if (widgetApi.widgetDetail?.widget.id === widgetId) {
        detail = widgetApi.widgetDetail;
        return;
      }
      loadError = widgetApi.error ?? $t('widgets.editor.load_failed');
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

<div class="bg-background min-h-screen w-full">
  {#if !$currentOrg.id}
    <div class="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <Spinner class="size-8!" />
      <p class="text-muted-foreground mt-4 text-sm">{$t('widgets.editor.waiting_org')}</p>
    </div>
  {:else if loadError}
    <div class="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <p class="text-destructive max-w-md text-center text-sm">{loadError}</p>
      <Button class="mt-4" href={resolve(`${$currentOrgPath}/widgets`, {})}>
        {$t('widgets.actions.back')}
      </Button>
    </div>
  {:else if !detail}
    <div class="flex min-h-[50vh] items-center justify-center">
      <Spinner class="size-8!" />
    </div>
  {:else}
    <WidgetEditorPage {detail} />
  {/if}
</div>
