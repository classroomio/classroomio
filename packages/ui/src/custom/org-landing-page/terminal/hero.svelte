<script lang="ts">
  import type { OrgLandingPageProps, CourseItem } from '../types';
  import type { Snippet } from 'svelte';
  import { Button } from '../../../base/button';
  import { BlurFade } from '../../animation/blurfade';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    orgName: OrgLandingPageProps['orgName'];
    hero: OrgLandingPageProps['hero'];
    courses: OrgLandingPageProps['courses'];
    navigation: Snippet;
  }

  let { orgName, hero, courses, navigation }: Props = $props();

  const programsCount = $derived(courses.length);
  const learnersCount = $derived(courses.reduce((sum, course) => sum + (course.totalStudents ?? 0), 0));
  const tracksCount = $derived(new Set(courses.map((course) => course.type).filter(Boolean)).size);

  const numberFormatter = new Intl.NumberFormat('en-US');
  const learnersFormatted = $derived(numberFormatter.format(learnersCount));

  function priceLabel(course: CourseItem): string {
    if (course.price) return course.price;
    if (!course.cost) return 'Free';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: course.currency ?? 'USD',
      maximumFractionDigits: 0
    }).format(course.cost);
  }

  function durationLabel(course: CourseItem): string {
    if (course.duration) return course.duration;
    if (course.lessonCount && course.lessonCount > 0) {
      return `${course.lessonCount} ${course.lessonCount === 1 ? 'lesson' : 'lessons'}`;
    }

    return '—';
  }

  const terminalRows = $derived(
    courses.slice(0, 5).map((course, index) => ({
      n: String(index + 1).padStart(2, '0'),
      slug: course.slug ?? course.id,
      price: priceLabel(course),
      duration: durationLabel(course)
    }))
  );

  const orgSlug = $derived(
    orgName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'org'
  );
</script>

{@render navigation()}

<EditableLandingSection sectionKey="hero">
  <section
    class="ui:relative ui:overflow-hidden ui:px-6 ui:pt-16 ui:pb-16 ui:md:pt-20 ui:md:pb-20"
    style="
    background: #06070a;
    --terminal-bg: #06070a;
    --terminal-bg-soft: #0c0e13;
    --terminal-bg-card: #0f1218;
    --terminal-bg-elevated: #14171f;
    --terminal-line: #1c1f28;
    --terminal-line-soft: #161922;
    --terminal-line-strong: #262a35;
    --terminal-ink: #e9eaed;
    --terminal-ink-dim: #9da1ab;
    --terminal-ink-muted: #61656f;
    --terminal-ink-faint: #3d4049;
  "
  >
    <div
      class="ui:pointer-events-none ui:absolute ui:inset-x-0 ui:-top-32 ui:h-[680px] ui:opacity-90"
      style="background: radial-gradient(ellipse 60% 70% at 50% 30%, color-mix(in oklab, var(--primary) 22%, transparent) 0%, transparent 65%);"
      aria-hidden="true"
    ></div>

    <div class="ui:relative ui:max-w-[1120px] ui:mx-auto ui:text-center">
      <BlurFade delay={0} once={true}>
        <h1
          class="ui:font-semibold ui:leading-[0.95] ui:mb-10 ui:max-w-[20ch] ui:mx-auto ui:text-balance"
          style="
          font-size: clamp(48px, 9vw, 128px);
          letter-spacing: -0.04em;
          background: linear-gradient(180deg,
            color-mix(in oklab, var(--primary) 60%, #ffffff) 0%,
            color-mix(in oklab, var(--primary) 35%, transparent) 45%,
            rgba(8, 10, 14, 0.3) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 8px 60px color-mix(in oklab, var(--primary) 18%, transparent);
          user-select: none;
        "
        >
          {hero.heading}
        </h1>
      </BlurFade>

      <BlurFade delay={0.12} once={true}>
        <div class="ui:inline-flex ui:items-center ui:gap-2 ui:mb-8">
          {#if hero.secondaryAction}
            <Button
              href={hero.secondaryAction.href}
              size="sm"
              variant="outline"
              class="ui:rounded-full ui:px-4 ui:font-medium ui:bg-white/5 ui:border-[var(--terminal-line-strong)] ui:text-[var(--terminal-ink)] ui:hover:bg-white/10"
            >
              {hero.secondaryAction.label}
            </Button>
          {/if}
          <Button
            href={hero.primaryAction.href}
            disabled={hero.primaryAction.disabled ?? false}
            size="sm"
            class="ui:rounded-full ui:px-4 ui:font-medium ui:bg-[#f4f5f7] ui:text-[#0a0b0e] ui:hover:bg-white"
          >
            {hero.primaryAction.label}
          </Button>
        </div>
      </BlurFade>

      <BlurFade delay={0.22} once={true}>
        <p class="ui:text-[15px] ui:mb-7 ui:max-w-xl ui:mx-auto" style="color: var(--terminal-ink-dim);">
          {hero.subheading}
        </p>
      </BlurFade>

      {#if programsCount > 0}
        <BlurFade delay={0.3} once={true}>
          <span
            class="ui:inline-flex ui:items-center ui:gap-3 ui:px-4 ui:py-2 ui:rounded-full ui:font-mono ui:text-[13px]"
            style="
            border: 1px solid var(--terminal-line-strong);
            background: rgba(255,255,255,0.02);
            backdrop-filter: blur(8px);
            color: var(--terminal-ink-dim);
          "
          >
            <span style="color: var(--primary);">&gt;</span>
            <span
              ><span style="color: var(--terminal-ink); font-weight: 500;">{programsCount}</span>
              {programsCount === 1 ? 'program' : 'programs'} running</span
            >
            {#if learnersCount > 0}
              <span class="ui:inline-block ui:w-px ui:h-3" style="background: var(--terminal-line-strong);"></span>
              <span
                ><span style="color: var(--terminal-ink); font-weight: 500;">{learnersFormatted}</span> learners</span
              >
            {/if}
            {#if tracksCount > 1}
              <span class="ui:inline-block ui:w-px ui:h-3" style="background: var(--terminal-line-strong);"></span>
              <span><span style="color: var(--terminal-ink); font-weight: 500;">{tracksCount}</span> tracks</span>
            {/if}
          </span>
        </BlurFade>
      {/if}

      {#if hero.image}
        <BlurFade delay={0.4} once={true}>
          <div
            class="ui:mt-14 ui:max-w-[880px] ui:mx-auto ui:rounded-xl ui:overflow-hidden ui:text-left"
            style="
            border: 1px solid var(--terminal-line-strong);
            background: var(--terminal-bg-card);
            box-shadow:
              0 30px 90px -30px rgba(0,0,0,0.7),
              0 0 0 1px color-mix(in oklab, var(--primary) 6%, transparent);
          "
          >
            <div
              class="ui:flex ui:items-center ui:gap-2 ui:px-4 ui:py-3"
              style="border-bottom: 1px solid var(--terminal-line); background: var(--terminal-bg-elevated);"
            >
              <span class="ui:flex ui:gap-1.5 ui:mr-2">
                <span class="ui:size-[11px] ui:rounded-full" style="background: #ff5f57;"></span>
                <span class="ui:size-[11px] ui:rounded-full" style="background: #febc2e;"></span>
                <span class="ui:size-[11px] ui:rounded-full" style="background: #28c840;"></span>
              </span>
              <span
                class="ui:flex-1 ui:text-center ui:font-mono ui:text-xs ui:truncate"
                style="color: var(--terminal-ink-dim);"
              >
                {orgSlug}/preview
              </span>
            </div>
            <img src={hero.image} alt={orgName} class="ui:block ui:w-full ui:h-auto" />
          </div>
        </BlurFade>
      {:else if terminalRows.length > 0}
        <BlurFade delay={0.4} once={true}>
          <div
            class="ui:mt-14 ui:max-w-[880px] ui:mx-auto ui:rounded-xl ui:overflow-hidden ui:text-left"
            style="
            border: 1px solid var(--terminal-line-strong);
            background: var(--terminal-bg-card);
            box-shadow:
              0 30px 90px -30px rgba(0,0,0,0.7),
              0 0 0 1px color-mix(in oklab, var(--primary) 6%, transparent);
          "
          >
            <div
              class="ui:flex ui:items-center ui:gap-2 ui:px-4 ui:py-3"
              style="border-bottom: 1px solid var(--terminal-line); background: var(--terminal-bg-elevated);"
            >
              <span class="ui:flex ui:gap-1.5 ui:mr-2">
                <span class="ui:size-[11px] ui:rounded-full" style="background: #ff5f57;"></span>
                <span class="ui:size-[11px] ui:rounded-full" style="background: #febc2e;"></span>
                <span class="ui:size-[11px] ui:rounded-full" style="background: #28c840;"></span>
              </span>
              <span
                class="ui:flex-1 ui:text-center ui:font-mono ui:text-xs ui:truncate"
                style="color: var(--terminal-ink-dim);"
              >
                {orgSlug}/main · catalog
              </span>
              <span class="ui:font-mono ui:text-[11px]" style="color: var(--terminal-ink-muted);">
                {programsCount}
                {programsCount === 1 ? 'program' : 'programs'}
              </span>
            </div>

            <div class="ui:p-5 ui:font-mono ui:text-[13px]" style="color: var(--terminal-ink); line-height: 1.7;">
              <div
                class="ui:flex ui:items-baseline ui:gap-2 ui:px-3 ui:py-2 ui:rounded-md ui:mb-3"
                style="background: rgba(255,255,255,0.02); border: 1px solid var(--terminal-line);"
              >
                <span style="color: var(--primary);">&gt;</span>
                <span>list programs --org {orgSlug}</span>
              </div>

              <div class="ui:py-1 ui:text-[12px]" style="color: var(--terminal-ink-muted);">
                ● Loaded {programsCount}
                {programsCount === 1 ? 'program' : 'programs'}
              </div>

              <div class="ui:mt-2 ui:flex ui:flex-col">
                {#each terminalRows as row (row.slug)}
                  <div class="ui:flex ui:items-baseline ui:gap-4 ui:py-1.5" style="color: var(--terminal-ink);">
                    <span style="color: var(--terminal-ink-faint);">{row.n}</span>
                    <span class="ui:truncate ui:flex-1" style="color: var(--primary);">{row.slug}</span>
                    <span class="ui:text-[12px]" style="color: var(--terminal-ink-dim);">{row.duration}</span>
                    <span class="ui:text-[12px] ui:w-20 ui:text-right">{row.price}</span>
                  </div>
                {/each}
              </div>

              <div class="ui:flex ui:items-baseline ui:gap-2 ui:mt-4">
                <span style="color: var(--primary);">&gt;</span>
                <span
                  class="ui:inline-block ui:w-2 ui:h-[14px] ui:align-middle"
                  style="background: var(--primary); animation: terminal-caret 1s steps(1) infinite;"
                  aria-hidden="true"
                ></span>
              </div>
            </div>

            <div
              class="ui:flex ui:items-center ui:justify-between ui:px-4 ui:py-2.5 ui:font-mono ui:text-[11px]"
              style="border-top: 1px solid var(--terminal-line); background: var(--terminal-bg-soft); color: var(--terminal-ink-muted);"
            >
              <div class="ui:flex ui:gap-4">
                <span>Enter enroll</span>
                <span>↑/↓ navigate</span>
                <span>^q quit</span>
              </div>
              <div style="color: var(--terminal-ink-dim);">{orgSlug}-cli</div>
            </div>
          </div>
        </BlurFade>
      {/if}
    </div>
  </section>
</EditableLandingSection>

<style>
  @keyframes terminal-caret {
    50% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    [style*='terminal-caret'] {
      animation: none !important;
    }
  }
</style>
