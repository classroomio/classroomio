<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import type { Snippet } from 'svelte';
  import SecondaryActionButton from '../secondary-action-button.svelte';
  import { Button } from '../../../base/button';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    hero: OrgLandingPageProps['hero'];
    courses: OrgLandingPageProps['courses'];
    navigation: Snippet;
    showActions?: boolean;
    compact?: boolean;
    children?: Snippet;
  }

  let { hero, courses = [], navigation, showActions = true, compact = false, children }: Props = $props();

  const coursesCount = $derived(courses.length);

  const statusLabel = $derived(
    coursesCount > 0
      ? `Now in session · ${coursesCount} ${coursesCount === 1 ? 'course' : 'courses'} running`
      : 'Studio opening soon'
  );

  const marqueeItems = $derived(courses.slice(0, 10));
  const showMarquee = $derived(marqueeItems.length > 0);
</script>

{@render navigation()}

<EditableLandingSection sectionKey="hero">
  <section
    class="ui:relative ui:overflow-hidden ui:px-6 {compact
      ? 'ui:pt-10 ui:pb-10 ui:md:pt-12 ui:md:pb-12'
      : 'ui:pt-20 ui:pb-20 ui:md:pt-24 ui:md:pb-24'}"
  >
    <div
      class="ui:pointer-events-none ui:absolute ui:-top-32 ui:-left-24 ui:h-[520px] ui:w-[520px] ui:rounded-full ui:opacity-60 ui:blur-3xl"
      style="background: radial-gradient(circle, color-mix(in oklab, var(--landing-accent) 35%, transparent) 0%, transparent 70%);"
      aria-hidden="true"
    ></div>
    <div
      class="ui:pointer-events-none ui:absolute ui:-top-20 ui:right-[-10%] ui:h-[420px] ui:w-[420px] ui:rounded-full ui:opacity-40 ui:blur-3xl"
      style="background: radial-gradient(circle, color-mix(in oklab, var(--landing-accent) 18%, transparent) 0%, transparent 70%);"
      aria-hidden="true"
    ></div>

    <div class="ui:relative ui:max-w-[1080px] ui:mx-auto">
      <span
        class="ui:inline-flex ui:items-center ui:gap-2 ui:mb-7 ui:px-3 ui:py-1.5 ui:rounded-full ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)]/70 ui:backdrop-blur-sm ui:text-[12px] ui:font-medium ui:text-[var(--landing-fg)]"
      >
        <span class="studio-status-dot ui:size-1.5 ui:rounded-full" aria-hidden="true"></span>
        {statusLabel}
      </span>

      <h1
        class="ui:text-4xl ui:md:text-5xl ui:lg:text-[64px] ui:font-semibold ui:tracking-tight ui:leading-[1.02] ui:max-w-[18ch] ui:mb-5 ui:text-[var(--landing-fg)] ui:text-balance"
      >
        {hero.heading}
      </h1>

      <p class="ui:text-base ui:md:text-lg ui:text-[var(--landing-fg-muted)] ui:max-w-xl ui:mb-8 ui:leading-relaxed">
        {hero.subheading}
      </p>

      {#if children}
        <div class="ui:mt-6">{@render children()}</div>
      {/if}
      {#if showActions}
        <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-2">
          <Button
            href={hero.primaryAction.href}
            disabled={hero.primaryAction.disabled ?? false}
            class="ui:rounded-md ui:px-5"
          >
            {hero.primaryAction.label}
          </Button>
          {#if hero.secondaryAction}
            <SecondaryActionButton
              href={hero.secondaryAction.href}
              label={hero.secondaryAction.label}
              variant="studio"
            />
          {/if}
        </div>
      {/if}

      {#if hero.image}
        <div
          class="studio-polaroid ui:mt-16 ui:relative ui:rounded-xl ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)] ui:p-2 ui:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.35)]"
        >
          <img
            src={hero.image}
            alt=""
            class="ui:w-full ui:h-auto ui:rounded-lg ui:border ui:border-[var(--landing-border)]"
          />
        </div>
      {/if}

      {#if showMarquee}
        <div
          class="studio-marquee-mask ui:mt-16 ui:py-4 ui:border-y ui:border-[var(--landing-border)]"
          aria-hidden="true"
        >
          <div class="studio-marquee-track ui:flex ui:gap-12 ui:whitespace-nowrap ui:w-max">
            {#each [...marqueeItems, ...marqueeItems] as course, index (`${course.id}-${index}`)}
              <span class="ui:inline-flex ui:items-center ui:gap-3">
                <span class="ui:size-1 ui:rounded-full ui:bg-[var(--landing-accent)]/70"></span>
                <span class="ui:text-sm ui:font-medium ui:text-[var(--landing-fg-muted)]">
                  {course.title}
                </span>
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </section>
</EditableLandingSection>

<style>
  .studio-status-dot {
    background-color: var(--landing-accent);
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--landing-accent) 60%, transparent);
    animation: studio-pulse 2s ease-out infinite;
  }

  @keyframes studio-pulse {
    0% {
      box-shadow: 0 0 0 0 color-mix(in oklab, var(--landing-accent) 50%, transparent);
    }
    70% {
      box-shadow: 0 0 0 8px color-mix(in oklab, var(--landing-accent) 0%, transparent);
    }
    100% {
      box-shadow: 0 0 0 0 color-mix(in oklab, var(--landing-accent) 0%, transparent);
    }
  }

  .studio-polaroid {
    transform: rotate(-0.8deg);
    transition: transform 400ms ease;
  }

  .studio-polaroid:hover {
    transform: rotate(0deg);
  }

  .studio-marquee-mask {
    overflow: hidden;
    mask-image: linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%);
  }

  .studio-marquee-track {
    animation: studio-marquee 40s linear infinite;
  }

  .studio-marquee-mask:hover .studio-marquee-track {
    animation-play-state: paused;
  }

  @keyframes studio-marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .studio-status-dot,
    .studio-marquee-track {
      animation: none;
    }
    .studio-polaroid {
      transform: none;
      transition: none;
    }
  }
</style>
