<script lang="ts">
  import { untrack } from 'svelte';
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import Stars from './atoms/stars.svelte';
  import TypeBadge from './atoms/type-badge.svelte';
  import Thumb from './atoms/thumb.svelte';

  let { payload }: { payload: TWidgetPayload } = $props();

  const options = $derived(payload.design.layoutOptions.tagFilter);
  const courses = $derived(payload.courses.slice(0, options.maxCount));
  const tagPool = $derived(payload.tagPool);
  let activeTagId = $state<string | null>(untrack(() => payload.design.layoutOptions.tagFilter.defaultTagId ?? null));

  const visibleCourses = $derived(
    activeTagId === null ? courses : courses.filter((course) => course.tags.some((tag) => tag.id === activeTagId))
  );
</script>

{#if tagPool.length > 0}
  <div class="cio-tf-bar" role="tablist">
    {#if options.showAllOption}
      <button type="button" class="cio-tf-btn" class:cio-on={activeTagId === null} onclick={() => (activeTagId = null)}
        >All</button
      >
    {/if}
    {#each tagPool as tag (tag.id)}
      <button
        type="button"
        class="cio-tf-btn"
        class:cio-on={activeTagId === tag.id}
        onclick={() => (activeTagId = activeTagId === tag.id ? null : tag.id)}>{tag.name}</button
      >
    {/each}
  </div>
{/if}

{#if visibleCourses.length === 0}
  <div class="cio-empty">No courses match this filter.</div>
{:else}
  <div class="cio-tf-grid">
    {#each visibleCourses as course (course.id)}
      <a class="cio-tf-row" href={course.url} target="_blank" rel="noreferrer noopener" aria-label={course.title}>
        {#if payload.design.content.showCourseImage}
          <div class="cio-tf-thumb">
            <Thumb src={course.imageUrl} alt={course.title} />
          </div>
        {/if}
        <div class="cio-tf-info">
          <h3 class="cio-tf-title">{course.title}</h3>
          <div class="cio-tf-sub">
            {#if payload.design.content.showCourseTypeBadge}
              <TypeBadge courseType={course.courseType} />
            {/if}
            <Stars rating={course.rating} ratingCount={course.ratingCount} showCount={false} />
          </div>
          {#if course.tags.length > 0}
            <div class="cio-tf-tags-row">
              {#each course.tags.slice(0, 3) as tag (tag.id)}
                <span class="cio-pill">{tag.name}</span>
              {/each}
            </div>
          {/if}
        </div>
      </a>
    {/each}
  </div>
{/if}
