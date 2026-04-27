<script lang="ts">
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import Stars from './atoms/stars.svelte';
  import TypeBadge from './atoms/type-badge.svelte';
  import Thumb from './atoms/thumb.svelte';
  import { getCourseExcerpt } from './utils';

  let { payload }: { payload: TWidgetPayload } = $props();

  const options = $derived(payload.design.layoutOptions.editorialSpotlight);
  const main = $derived(payload.courses[0] ?? null);
  const secondary = $derived(payload.courses.slice(1, 1 + options.secondaryMaxCount));
</script>

{#if !main}
  <div class="cio-empty">Pick a main course to display.</div>
{:else}
  <div class="cio-ed-grid">
    <a class="cio-ed-main" href={main.url} target="_blank" rel="noreferrer noopener" aria-label={main.title}>
      {#if payload.design.content.showCourseImage}
        <div class="cio-ed-img-wrap">
          <Thumb src={main.imageUrl} alt={main.title} />
        </div>
      {/if}
      <div class="cio-ed-body">
        {#if payload.design.content.showCourseTypeBadge || main.tags.length > 0}
          <div class="cio-ed-top-meta">
            {#if payload.design.content.showCourseTypeBadge}
              <TypeBadge courseType={main.courseType} />
            {/if}
            {#each main.tags.slice(0, 1) as tag (tag.id)}
              <span class="cio-pill">{tag.name}</span>
            {/each}
          </div>
        {/if}
        <h2 class="cio-ed-title" class:cio-title-sans={options.titleStyle === 'sans'}>{main.title}</h2>
        {#if payload.design.content.showDescriptionExcerpt && main.description}
          <p class="cio-ed-desc">{getCourseExcerpt(main, 200)}</p>
        {/if}
        <div class="cio-ed-foot">
          <Stars rating={main.rating} ratingCount={main.ratingCount} />
          {#if main.tags.length > 0}
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              {#each main.tags.slice(0, 3) as tag (tag.id)}
                <span class="cio-pill">{tag.name}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </a>
    {#if secondary.length > 0}
      <div class="cio-ed-stack">
        {#each secondary as course (course.id)}
          <a class="cio-ed-mini" href={course.url} target="_blank" rel="noreferrer noopener">
            {#if payload.design.content.showCourseImage}
              <div class="cio-ed-mini-img">
                <Thumb src={course.imageUrl} alt={course.title} />
              </div>
            {/if}
            <div>
              <h3 class="cio-ed-mini-title">{course.title}</h3>
              <div class="cio-ed-mini-meta">
                {#if payload.design.content.showCourseTypeBadge}
                  <TypeBadge courseType={course.courseType} />
                {/if}
                <Stars rating={course.rating} ratingCount={course.ratingCount} showCount={false} />
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
{/if}
