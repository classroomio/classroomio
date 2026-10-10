<script lang="ts">
  import { onMount } from 'svelte';
  import PlayIcon from '@lucide/svelte/icons/play';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { t } from '$lib/utils/functions/translations';
  import { whatsNewApi } from '../api/whats-new.svelte';

  const entry = $derived(whatsNewApi.nextEntry);
  const remaining = $derived(whatsNewApi.unseenEntries.length);

  onMount(() => {
    void whatsNewApi.load();
  });
</script>

{#if whatsNewApi.isLoading || entry}
  <section class="ui:group-data-[collapsible=icon]:hidden relative pt-1.5" data-testid="whats-new-card">
    {#if remaining > 2}
      <span
        class="ui:bg-background ui:border-border absolute inset-x-3 top-0 h-2 rounded-t-md border"
        aria-hidden="true"
      ></span>
    {/if}
    {#if remaining > 1}
      <span
        class="ui:bg-background ui:border-border absolute inset-x-1.5 top-0.5 h-2 rounded-t-md border"
        aria-hidden="true"
      ></span>
    {/if}

    {#if entry}
      <button
        type="button"
        class="ui:bg-background ui:border-border relative block w-full cursor-pointer overflow-hidden rounded-md border text-left shadow-sm transition-shadow hover:shadow-md"
        onclick={() => whatsNewApi.open()}
      >
        <div class="relative aspect-[16/7] w-full bg-rose-100 dark:bg-rose-950">
          {#if entry.coverUrl}
            <img src={entry.coverUrl} alt="" class="size-full object-cover" loading="lazy" />
          {/if}
          <span
            class="absolute top-1.5 left-1.5 rounded-full bg-white px-1.5 py-px text-[10px] font-bold text-black uppercase"
          >
            {$t('whats_new.new_badge')}
          </span>
          {#if entry.videoId}
            <span class="absolute inset-0 flex items-center justify-center">
              <span class="flex size-7 items-center justify-center rounded-full bg-white text-black shadow">
                <PlayIcon class="size-3 fill-current" />
              </span>
            </span>
          {/if}
        </div>
        <div class="flex flex-col gap-0.5 px-2.5 py-2">
          <p class="ui:text-foreground line-clamp-2 text-xs leading-snug font-semibold">{entry.title}</p>
          {#if entry.summary}
            <p class="ui:text-muted-foreground line-clamp-1 text-[11px]">{entry.summary}</p>
          {/if}
        </div>
      </button>
    {:else}
      <div class="ui:bg-background ui:border-border relative overflow-hidden rounded-md border">
        <Skeleton class="aspect-[16/7] w-full rounded-none" />
        <div class="flex flex-col gap-1.5 px-2.5 py-2">
          <Skeleton class="h-3 w-3/4" />
          <Skeleton class="h-2.5 w-full" />
        </div>
      </div>
    {/if}
  </section>
{/if}
