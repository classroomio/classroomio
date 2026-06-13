<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import Stars from './atoms/stars.svelte';
  import TypeBadge from './atoms/type-badge.svelte';
  import Thumb from './atoms/thumb.svelte';
  import { formatLessonsLine } from './utils';

  let { payload }: { payload: TWidgetPayload } = $props();

  const options = $derived(payload.design.layoutOptions.carousel);
  const courses = $derived(payload.courses.slice(0, options.maxCount));
  const visible = $derived(Number(options.visibleCards));
  const maxIndex = $derived(Math.max(courses.length - visible, 0));

  let position = $state(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const cardBasis = $derived(`calc((100% - ${(visible - 1) * 12}px) / ${visible})`);
  const translatePct = $derived(courses.length > 0 ? `calc(-${position} * (100% + 12px) / ${visible})` : '0');

  function go(index: number) {
    if (maxIndex === 0) {
      position = 0;
      return;
    }
    if (options.loop) {
      position = ((index % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
    } else {
      position = Math.max(0, Math.min(index, maxIndex));
    }
  }

  function startAutoplay() {
    if (!options.autoPlay || maxIndex === 0) return;
    timer = setInterval(() => go(position + 1), Math.max(options.autoPlayIntervalMs, 3000));
  }

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  onMount(() => {
    startAutoplay();
  });

  onDestroy(() => {
    stopAutoplay();
  });

  $effect(() => {
    if (position > maxIndex) position = maxIndex;
  });
</script>

{#if courses.length === 0}
  <div class="cio-empty">No courses to display.</div>
{:else}
  <div
    class="cio-cr-wrap"
    onmouseenter={stopAutoplay}
    onmouseleave={startAutoplay}
    role="region"
    aria-roledescription="carousel"
  >
    <div class="cio-cr-outer">
      <div class="cio-cr-track" style={`transform: translateX(${translatePct})`}>
        {#each courses as course (course.id)}
          <a
            class="cio-cr-card"
            href={course.url}
            target="_blank"
            rel="noreferrer noopener"
            style={`flex:0 0 ${cardBasis}`}
          >
            {#if payload.design.content.showCourseImage}
              <div class="cio-cr-img">
                <Thumb src={course.imageUrl} alt={course.title} />
              </div>
            {/if}
            <div class="cio-cr-body">
              <h3 class="cio-cr-title">{course.title}</h3>
              <div class="cio-cr-rating-row">
                <Stars rating={course.rating} ratingCount={course.ratingCount} showCount={false} />
              </div>
              {#if payload.design.content.showCourseTypeBadge}
                <div class="cio-cr-tags-row">
                  <TypeBadge courseType={course.courseType} />
                </div>
              {/if}
              <div class="cio-cr-meta">{formatLessonsLine(course, payload.design.content.showLessonsCount)}</div>
            </div>
          </a>
        {/each}
      </div>
    </div>
    {#if maxIndex > 0 && (options.showDots || options.showArrows)}
      <div class="cio-cr-nav">
        {#if options.showDots}
          <div class="cio-cr-dots">
            {#each Array(maxIndex + 1) as _, i (i)}
              <button
                type="button"
                class="cio-cr-dot"
                class:cio-on={i === position}
                aria-label={`Go to slide ${i + 1}`}
                onclick={() => go(i)}
              ></button>
            {/each}
          </div>
        {:else}
          <span></span>
        {/if}
        {#if options.showArrows}
          <div class="cio-cr-arrows">
            <button
              type="button"
              class="cio-cr-btn"
              onclick={() => go(position - 1)}
              disabled={!options.loop && position === 0}
              aria-label="Previous"
            >
              <svg
                class="cio-cr-btn-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              class="cio-cr-btn"
              onclick={() => go(position + 1)}
              disabled={!options.loop && position === maxIndex}
              aria-label="Next"
            >
              <svg
                class="cio-cr-btn-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        {:else}
          <span></span>
        {/if}
      </div>
    {/if}
  </div>
{/if}
