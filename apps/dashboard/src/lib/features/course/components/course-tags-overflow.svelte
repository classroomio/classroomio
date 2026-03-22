<script lang="ts">
  import { tick } from 'svelte';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import * as Item from '@cio/ui/base/item';
  import { t } from '$lib/utils/functions/translations';

  interface Tag {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  }

  interface Props {
    tags: Tag[];
    variant?: 'card' | 'table';
  }

  let { tags, variant = 'card' }: Props = $props();

  let tagsRowEl: HTMLDivElement | undefined = $state();
  let tagsMeasureEl: HTMLDivElement | undefined = $state();
  let overflowBadgeMeasureEl: HTMLSpanElement | undefined = $state();
  /** -1 = not measured yet (show all tags until layout runs) */
  let visibleTagCount = $state(-1);

  const tagGapPx = $derived(variant === 'table' ? 8 : 4);
  const gapClass = $derived(variant === 'table' ? 'gap-2' : 'gap-1');

  function computeVisibleTagCount() {
    if (tags.length === 0) {
      visibleTagCount = 0;
      return;
    }
    if (!tagsRowEl || !tagsMeasureEl) {
      visibleTagCount = -1;
      return;
    }

    const widths = Array.from(tagsMeasureEl.children).map((el) => (el as HTMLElement).offsetWidth);
    const containerWidth = tagsRowEl.clientWidth;
    const badgeMaxWidth = overflowBadgeMeasureEl?.offsetWidth ?? 40;
    const n = widths.length;
    const gap = tagGapPx;

    if (containerWidth <= 0) {
      visibleTagCount = n;
      return;
    }

    let best = 0;
    for (let k = 0; k <= n; k++) {
      const rest = n - k;
      let sum = 0;
      for (let i = 0; i < k; i++) {
        sum += widths[i] ?? 0;
        if (i > 0) sum += gap;
      }
      const needBadge = rest > 0;
      const total = sum + (needBadge ? gap + badgeMaxWidth : 0);
      if (total <= containerWidth) {
        best = k;
      }
    }
    visibleTagCount = best;
  }

  const displayTagCount = $derived(visibleTagCount < 0 ? tags.length : visibleTagCount);

  $effect(() => {
    void tags;
    void tagsRowEl;
    void tagsMeasureEl;
    void overflowBadgeMeasureEl;
    void variant;

    const schedule = () => {
      requestAnimationFrame(() => {
        computeVisibleTagCount();
      });
    };

    tick().then(schedule);

    if (!tagsRowEl) {
      return;
    }

    const ro = new ResizeObserver(schedule);
    ro.observe(tagsRowEl);
    return () => ro.disconnect();
  });

  const hiddenTags = $derived(tags.slice(displayTagCount));
  const hiddenTagsLabel = $derived(hiddenTags.map((t) => t.name).join(', '));
</script>

{#if tags.length > 0}
  <div class="relative min-h-[12px] w-full min-w-0">
    <div
      class="pointer-events-none invisible absolute top-0 left-0 -z-10 flex {gapClass}"
      bind:this={tagsMeasureEl}
      aria-hidden="true"
    >
      {#each tags as tag (tag.id)}
        {#if variant === 'card'}
          <Item.SubDescription class="border-border inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2">
            <span
              class="ui:bg-primary/60 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={tag.color ? `background-color: ${tag.color}` : undefined}
              aria-hidden="true"
            ></span>
            <span>{tag.name}</span>
          </Item.SubDescription>
        {:else}
          <span class="ui:text-muted-foreground text-2xs inline-flex shrink-0 items-center gap-1.5">
            <span
              class="ui:bg-primary/60 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={tag.color ? `background-color: ${tag.color}` : undefined}
              aria-hidden="true"
            ></span>
            <span>{tag.name}</span>
          </span>
        {/if}
      {/each}
    </div>
    <span
      bind:this={overflowBadgeMeasureEl}
      class="border-border ui:text-muted-foreground pointer-events-none invisible absolute top-0 left-0 -z-10 inline-flex shrink-0 items-center rounded-full border {variant ===
      'table'
        ? 'text-2xs px-1.5 py-0.5'
        : 'px-2 text-xs'}"
      aria-hidden="true"
    >
      +{tags.length}
    </span>
    <div
      bind:this={tagsRowEl}
      class="ui:text-muted-foreground flex min-w-0 flex-nowrap items-center overflow-hidden {gapClass} {variant ===
      'table'
        ? 'text-2xs'
        : ''}"
    >
      {#each tags.slice(0, displayTagCount) as tag (tag.id)}
        {#if variant === 'card'}
          <Item.SubDescription class="border-border inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2">
            <span
              class="ui:bg-primary/60 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={tag.color ? `background-color: ${tag.color}` : undefined}
              aria-hidden="true"
            ></span>
            <span>{tag.name}</span>
          </Item.SubDescription>
        {:else}
          <span class="inline-flex shrink-0 items-center gap-1.5">
            <span
              class="ui:bg-primary/60 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={tag.color ? `background-color: ${tag.color}` : undefined}
              aria-hidden="true"
            ></span>
            <span>{tag.name}</span>
          </span>
        {/if}
      {/each}
      {#if hiddenTags.length > 0}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                {#if variant === 'card'}
                  <Item.SubDescription
                    {...props}
                    class="border-border inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-full border px-2"
                    aria-label={$t('courses.course_card.tags_overflow_aria', {
                      count: hiddenTags.length
                    })}
                  >
                    +{hiddenTags.length}
                  </Item.SubDescription>
                {:else}
                  <span
                    {...props}
                    class="border-border ui:text-muted-foreground text-2xs inline-flex shrink-0 cursor-default items-center rounded-full border px-1.5 py-0.5"
                    aria-label={$t('courses.course_card.tags_overflow_aria', {
                      count: hiddenTags.length
                    })}
                  >
                    +{hiddenTags.length}
                  </span>
                {/if}
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="top" sideOffset={4} class="max-w-xs">
              {hiddenTagsLabel}
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      {/if}
    </div>
  </div>
{/if}
