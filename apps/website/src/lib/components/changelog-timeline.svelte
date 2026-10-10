<script lang="ts">
  import { formatDate } from '$lib/utils/format-date';
  import type { ChangelogEntry } from '$lib/utils/types';

  interface Props {
    entries: ChangelogEntry[];
  }

  let { entries }: Props = $props();
</script>

<ol class="relative ml-2 border-l border-gray-200">
  {#each entries as entry (entry.id)}
    <li class="relative pb-12 pl-8 last:pb-0">
      <span
        class="absolute top-1.5 -left-[5px] size-2.5 rounded-full border-2 border-gray-50 bg-blue-700 ring-1 ring-blue-700"
      ></span>

      <div class="grid items-start gap-5 {entry.coverUrl ? 'md:grid-cols-[240px_1fr]' : ''}">
        {#if entry.coverUrl}
          <a href={entry.url} target="_blank" rel="noopener noreferrer" class="block">
            <img
              src={entry.coverUrl}
              alt={entry.title}
              loading="lazy"
              class="aspect-video w-full rounded-md border border-gray-200 object-cover"
            />
          </a>
        {/if}

        <div>
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <p class="text-label font-mono text-slate-500 uppercase">{formatDate(entry.publishedAt.slice(0, 10))}</p>
            {#each entry.tags as tag (tag)}
              <span
                class="text-tag ui:border-border ui:text-foreground rounded-full border px-2 py-0.5 font-mono uppercase"
                >{tag}</span
              >
            {/each}
          </div>

          <h3 class="text-card-title font-medium text-balance text-gray-950">{entry.title}</h3>

          {#if entry.summary}
            <p class="ui:text-muted-foreground mt-2 line-clamp-3 text-[15px] leading-relaxed">{entry.summary}</p>
          {/if}

          <div class="mt-3">
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium text-blue-700 no-underline hover:underline">Read more →</a
            >
          </div>
        </div>
      </div>
    </li>
  {/each}
</ol>
