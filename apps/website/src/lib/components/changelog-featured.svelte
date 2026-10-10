<script lang="ts">
  import { BoardFrame } from '@cio/ui/custom/board-frame';
  import { formatDate } from '$lib/utils/format-date';
  import type { ChangelogEntry } from '$lib/utils/types';
  import CtaButton from './ui/cta-button.svelte';
  import NotchCard from './ui/notch-card.svelte';

  interface Props {
    entry: ChangelogEntry;
  }

  let { entry }: Props = $props();

  const displayUrl = $derived(entry.url.replace(/^https?:\/\//, ''));
</script>

<NotchCard class="mx-auto max-w-[1300px] bg-white" notchClass="bg-gray-50">
  <article class="grid items-center gap-2 {entry.coverUrl ? 'lg:grid-cols-[1.5fr_1fr]' : ''}">
    {#if entry.coverUrl}
      <BoardFrame src={entry.coverUrl} alt={entry.title} url={displayUrl} />
    {/if}

    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-tag rounded-full bg-blue-700 px-2 py-0.5 font-mono text-white uppercase">Latest</span>
        <p class="text-label font-mono text-gray-500 uppercase">{formatDate(entry.publishedAt.slice(0, 10))}</p>
        {#each entry.tags as tag (tag)}
          <span class="text-tag rounded-full border border-gray-200 px-2 py-0.5 font-mono text-gray-950 uppercase"
            >{tag}</span
          >
        {/each}
      </div>

      <h2 class="text-h3 font-medium text-balance text-gray-950">{entry.title}</h2>

      {#if entry.summary}
        <p class="line-clamp-6 text-base leading-relaxed text-pretty text-gray-500">{entry.summary}</p>
      {/if}

      <div>
        <CtaButton href={entry.url} target="_blank" rel="noopener noreferrer" arrow>Read the full update</CtaButton>
      </div>
    </div>
  </article>
</NotchCard>
