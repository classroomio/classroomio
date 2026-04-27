<script lang="ts">
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import Stars from './atoms/stars.svelte';
  import TypeBadge from './atoms/type-badge.svelte';
  import Thumb from './atoms/thumb.svelte';
  import { formatLessonsLine, getCourseExcerpt } from './utils';

  let { payload }: { payload: TWidgetPayload } = $props();

  const options = $derived(payload.design.layoutOptions.cardGrid);
  const showRating = $derived(options.showRating);
  const courses = $derived(payload.courses.slice(0, options.maxCount));
  const cssVars = $derived(`--cio-cg-cols:${options.columns}`);
</script>

{#if courses.length === 0}
  <div class="cio-empty">No courses to display.</div>
{:else}
  <div class="cio-cg-grid" style={cssVars}>
    {#each courses as course (course.id)}
      <a class="cio-cg-card" href={course.url} target="_blank" rel="noreferrer noopener" aria-label={course.title}>
        {#if payload.design.content.showCourseImage}
          <div class="cio-cg-img">
            <Thumb src={course.imageUrl} alt={course.title} className="cio-cg-img-art" />
            {#if payload.design.content.showCourseTypeBadge}
              <span style="position:relative;z-index:1">
                <TypeBadge courseType={course.courseType} />
              </span>
            {/if}
          </div>
        {/if}
        <div class="cio-cg-body">
          <h3 class="cio-cg-title">{course.title}</h3>
          {#if payload.design.content.showDescriptionExcerpt && course.description}
            <p class="cio-cg-desc">{getCourseExcerpt(course)}</p>
          {/if}
          {#if course.tags.length > 0}
            <div class="cio-cg-tags">
              {#each course.tags.slice(0, 3) as tag (tag.id)}
                <span class="cio-pill">{tag.name}</span>
              {/each}
              {#if course.tags.length > 3}
                <span class="cio-pill">+{course.tags.length - 3}</span>
              {/if}
            </div>
          {/if}
          <div class="cio-cg-footer">
            {#if showRating}
              <Stars rating={course.rating} ratingCount={course.ratingCount} />
            {:else}
              <span></span>
            {/if}
            <span class="cio-cg-meta">{formatLessonsLine(course)}</span>
          </div>
        </div>
      </a>
    {/each}
  </div>
{/if}
