<script lang="ts">
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import Stars from './atoms/stars.svelte';
  import TypeBadge from './atoms/type-badge.svelte';
  import Thumb from './atoms/thumb.svelte';
  import { formatLessonsLine, getCourseExcerpt } from './utils';

  let { payload }: { payload: TWidgetPayload } = $props();

  const options = $derived(payload.design.layoutOptions.primaryCourse);
  const featured = $derived(payload.courses[0] ?? null);
  const secondary = $derived(payload.courses.slice(1, 1 + options.secondaryMaxCount));
</script>

{#if !featured}
  <div class="cio-empty">Pick a featured course to display.</div>
{:else}
  <a class="cio-ph-hero" href={featured.url} target="_blank" rel="noreferrer noopener">
    <div>
      <div class="cio-ph-eyebrow">{options.eyebrowLabel}</div>
      <h2 class="cio-ph-title">{featured.title}</h2>
      {#if payload.design.content.showDescriptionExcerpt && featured.description}
        <p class="cio-ph-desc">{getCourseExcerpt(featured, 220)}</p>
      {/if}
      <div class="cio-ph-row">
        {#if featured.rating != null}
          <span class="cio-ph-rating-val">{featured.rating.toFixed(1)}</span>
          <span class="cio-ph-star">★★★★★</span>
          {#if featured.ratingCount}
            <span class="cio-ph-count">({featured.ratingCount} reviews)</span>
          {/if}
          <span class="cio-ph-sep">·</span>
        {/if}
        <span class="cio-ph-meta">{formatLessonsLine(featured)}</span>
      </div>
      {#if payload.design.content.showCourseTypeBadge || featured.tags.length > 0}
        <div class="cio-ph-badges">
          {#if payload.design.content.showCourseTypeBadge}
            <TypeBadge courseType={featured.courseType} />
          {/if}
          {#each featured.tags.slice(0, 2) as tag (tag.id)}
            <span class="cio-pill">{tag.name}</span>
          {/each}
        </div>
      {/if}
      <span class="cio-ph-btn">{options.ctaLabel} →</span>
    </div>
    {#if payload.design.content.showCourseImage}
      <div class="cio-ph-img">
        <Thumb src={featured.imageUrl} alt={featured.title} />
      </div>
    {/if}
  </a>
  {#if secondary.length > 0}
    <div class="cio-ph-grid">
      {#each secondary as course (course.id)}
        <a class="cio-ph-mini" href={course.url} target="_blank" rel="noreferrer noopener">
          <h3 class="cio-ph-mini-title">{course.title}</h3>
          <div class="cio-ph-mini-meta">
            {#if payload.design.content.showCourseTypeBadge}
              <TypeBadge courseType={course.courseType} />
            {/if}
            <Stars rating={course.rating} ratingCount={course.ratingCount} showCount={false} />
          </div>
        </a>
      {/each}
    </div>
  {/if}
{/if}
