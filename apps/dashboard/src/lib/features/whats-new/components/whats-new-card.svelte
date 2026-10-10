<script lang="ts">
  import { onMount } from 'svelte';
  import PlayIcon from '@lucide/svelte/icons/play';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { t } from '$lib/utils/functions/translations';
  import { whatsNewApi } from '../api/whats-new.svelte';

  const entry = $derived(whatsNewApi.latestEntry);
  const isNew = $derived(whatsNewApi.newCount > 0);

  onMount(() => {
    void whatsNewApi.load();
  });
</script>

{#if whatsNewApi.isLoading || entry}
  <section class="ui:group-data-[collapsible=icon]:hidden flex flex-col gap-2" data-testid="whats-new-card">
    <div class="flex items-center justify-between px-1">
      <h3 class="ui:text-foreground text-sm font-semibold">{$t('whats_new.heading')}</h3>
      {#if isNew}
        <span
          class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {$t('whats_new.new_count', { count: whatsNewApi.newCount })}
        </span>
      {/if}
    </div>

    <div class="relative pt-2">
      <span
        class="ui:bg-background ui:border-border absolute inset-x-3 top-0 h-3 rounded-t-md border"
        aria-hidden="true"
      ></span>
      <span
        class="ui:bg-background ui:border-border absolute inset-x-1.5 top-1 h-3 rounded-t-md border"
        aria-hidden="true"
      ></span>

      {#if entry}
        <button
          type="button"
          class="ui:bg-background ui:border-border relative block w-full cursor-pointer overflow-hidden rounded-md border text-left shadow-sm transition-shadow hover:shadow-md"
          onclick={() => whatsNewApi.open()}
        >
          <div class="relative aspect-video w-full bg-rose-100 dark:bg-rose-950">
            {#if entry.coverUrl}
              <img src={entry.coverUrl} alt="" class="size-full object-cover" loading="lazy" />
            {/if}
            {#if isNew}
              <span
                class="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-black uppercase"
              >
                {$t('whats_new.new_badge')}
              </span>
            {/if}
            {#if entry.videoId}
              <span class="absolute inset-0 flex items-center justify-center">
                <span class="flex size-10 items-center justify-center rounded-full bg-white text-black shadow">
                  <PlayIcon class="size-4 fill-current" />
                </span>
              </span>
            {/if}
          </div>
          <div class="flex flex-col gap-1 p-3">
            <p class="ui:text-foreground line-clamp-2 text-sm font-semibold">{entry.title}</p>
            {#if entry.summary}
              <p class="ui:text-muted-foreground line-clamp-2 text-xs">{entry.summary}</p>
            {/if}
          </div>
        </button>
      {:else}
        <div class="ui:bg-background ui:border-border relative overflow-hidden rounded-md border">
          <Skeleton class="aspect-video w-full rounded-none" />
          <div class="flex flex-col gap-2 p-3">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-full" />
          </div>
        </div>
      {/if}
    </div>
  </section>
{/if}
