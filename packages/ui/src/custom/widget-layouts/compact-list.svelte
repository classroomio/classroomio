<script lang="ts">
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import Stars from './atoms/stars.svelte';
  import TypeBadge from './atoms/type-badge.svelte';
  import Thumb from './atoms/thumb.svelte';
  import { formatLessonsLine } from './utils';

  let { payload }: { payload: TWidgetPayload } = $props();

  const options = $derived(payload.design.layoutOptions.compactList);
  const courses = $derived(payload.courses.slice(0, options.maxCount));
</script>

{#if courses.length === 0}
  <div class="cio-empty">No courses to display.</div>
{:else}
  <div class="cio-cl-list" class:cio-density-compact={options.density === 'compact'}>
    {#each courses as course (course.id)}
      <a class="cio-cl-item" href={course.url} target="_blank" rel="noreferrer noopener" aria-label={course.title}>
        {#if options.showThumbnail && payload.design.content.showCourseImage}
          <div class="cio-cl-thumb">
            <Thumb src={course.imageUrl} alt={course.title} />
          </div>
        {/if}
        <div class="cio-cl-info">
          <div class="cio-cl-top">
            <span class="cio-cl-title">{course.title}</span>
            {#if payload.design.content.showLessonsCount}
              <span class="cio-cl-lessons">{formatLessonsLine(course, payload.design.content.showLessonsCount)}</span>
            {/if}
          </div>
          <div class="cio-cl-mid">
            {#if payload.design.content.showCourseTypeBadge}
              <TypeBadge courseType={course.courseType} />
            {/if}
            <Stars rating={course.rating} ratingCount={course.ratingCount} />
          </div>
          {#if options.showTags && course.tags.length > 0}
            <div class="cio-cl-bottom">
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
