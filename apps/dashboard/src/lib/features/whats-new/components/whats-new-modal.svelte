<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { locale, t } from '$lib/utils/functions/translations';
  import { whatsNewApi } from '../api/whats-new.svelte';
  import { getYoutubeEmbedUrl } from '../utils/whats-new-utils';

  const entry = $derived(whatsNewApi.latestEntry);
  const publishedDate = $derived(
    entry
      ? new Date(entry.publishedAt).toLocaleDateString($locale || 'en', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : ''
  );

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    whatsNewApi.close();
  }
</script>

{#if entry}
  <Dialog.Root open={whatsNewApi.isOpen} onOpenChange={handleOpenChange}>
    <Dialog.Content class="max-h-[92dvh] w-[96vw] max-w-2xl! gap-0 overflow-y-auto p-0">
      <div class="ui:bg-muted aspect-video w-full overflow-hidden rounded-t-lg">
        {#if entry.videoId}
          <iframe
            class="size-full"
            src={getYoutubeEmbedUrl(entry.videoId)}
            title={entry.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        {:else if entry.coverUrl}
          <img src={entry.coverUrl} alt="" class="size-full object-cover" />
        {/if}
      </div>

      <div class="flex flex-col gap-3 p-5 sm:p-6">
        <div class="flex flex-wrap items-center gap-2">
          <span class="ui:text-muted-foreground text-xs font-medium uppercase">{publishedDate}</span>
          {#each entry.tags as tag (tag)}
            <span class="ui:border-border rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase">{tag}</span
            >
          {/each}
        </div>

        <Dialog.Title class="text-xl font-semibold text-balance">{entry.title}</Dialog.Title>

        {#if entry.summary}
          <Dialog.Description class="text-pretty">{entry.summary}</Dialog.Description>
        {/if}

        <Dialog.Footer class="mt-2">
          <Button size="sm" variant="outline" onclick={() => whatsNewApi.close()}>{$t('whats_new.close')}</Button>
          <Button size="sm" href={entry.url} target="_blank" rel="noopener noreferrer">
            {$t('whats_new.read_full')}
          </Button>
        </Dialog.Footer>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{/if}
