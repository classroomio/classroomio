<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import { Button } from '@cio/ui/base/button';
  import type { Testimonial } from '$lib/utils/types';

  interface Props {
    testimonials: Testimonial[];
  }

  let { testimonials }: Props = $props();

  let activeIndex = $state(0);

  const total = $derived(testimonials.length);
  const counterLabel = $derived(`${String(activeIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`);

  function showPrevious() {
    activeIndex = (activeIndex - 1 + total) % total;
  }

  function showNext() {
    activeIndex = (activeIndex + 1) % total;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') showPrevious();
    if (event.key === 'ArrowRight') showNext();
  }
</script>

<section class="px-6 py-20 md:px-10 md:py-28">
  <div
    class="max-w-content relative mx-auto overflow-hidden rounded-md bg-blue-700 px-6 py-16 md:px-16 md:py-24"
    role="region"
    aria-roledescription="carousel"
    aria-label="Customer testimonials"
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    <div class="cio-iso-grid pointer-events-none absolute inset-0" aria-hidden="true"></div>

    <div class="relative max-w-[860px]">
      <div class="flex items-center gap-2">
        <Button variant="secondary" size="icon-lg" aria-label="Previous testimonial" onclick={showPrevious}>
          <ArrowLeft />
        </Button>
        <Button variant="secondary" size="icon-lg" aria-label="Next testimonial" onclick={showNext}>
          <ArrowRight />
        </Button>
        <span class="text-label ml-3 font-mono text-blue-200 uppercase" aria-hidden="true">{counterLabel}</span>
      </div>

      <div class="mt-10 grid" aria-live="polite">
        {#each testimonials as testimonial, index (testimonial.id)}
          {@const isActive = index === activeIndex}
          <figure
            class="col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none {isActive
              ? 'opacity-100'
              : 'invisible opacity-0'}"
            aria-hidden={!isActive}
          >
            <blockquote
              class="text-[clamp(22px,2.4vw,30px)] leading-[1.4] font-medium tracking-[-0.015em] text-pretty text-white"
            >
              {#each testimonial.quote as segment, segmentIndex (segmentIndex)}
                {#if segment.highlight}
                  <mark class="rounded-xs bg-white/15 box-decoration-clone px-1 text-white">{segment.text}</mark>
                {:else}
                  {segment.text}
                {/if}
              {/each}
            </blockquote>

            <figcaption class="mt-10 flex items-center gap-3">
              <img
                src={testimonial.avatar}
                alt=""
                width="44"
                height="44"
                loading="lazy"
                class="size-11 shrink-0 rounded-full object-cover ring-2 ring-white/20"
              />
              <span class="flex flex-col gap-0.5">
                <span class="text-[15px] font-semibold text-white">{testimonial.name}</span>
                <span class="text-[13px] text-blue-200">{testimonial.role}</span>
              </span>
            </figcaption>
          </figure>
        {/each}
      </div>
    </div>

    <span aria-hidden="true" class="cio-notch pointer-events-none absolute -top-px left-7 h-[11px] w-[46px] bg-white"
    ></span>
  </div>
</section>
