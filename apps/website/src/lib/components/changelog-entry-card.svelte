<script lang="ts">
  import { formatDate } from '$lib/utils/format-date';
  import type { ChangelogEntry } from '$lib/utils/types';

  interface Props {
    entry: ChangelogEntry;
  }

  let { entry }: Props = $props();
</script>

<article>
  <div class="mb-4 flex flex-wrap items-center gap-2">
    <p class="text-label font-mono text-slate-500 uppercase">{formatDate(entry.publishedAt.slice(0, 10))}</p>
    {#each entry.tags as tag (tag)}
      <span class="text-tag ui:border-border ui:text-foreground rounded-full border px-2 py-0.5 font-mono uppercase"
        >{tag}</span
      >
    {/each}
  </div>

  <h2 class="text-title font-medium text-balance text-gray-950">{entry.title}</h2>

  {#if entry.coverUrl}
    <img
      loading="lazy"
      src={entry.coverUrl}
      alt={entry.title}
      class="mt-6 w-full rounded-xl border border-gray-200 object-cover"
    />
  {/if}

  {#if entry.summary}
    <p class="ui:text-muted-foreground mt-4 text-[15px] leading-relaxed">{entry.summary}</p>
  {/if}
</article>
