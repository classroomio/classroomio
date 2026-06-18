<script lang="ts">
  import type { OrgLandingPageProps, CourseItem } from '../types';
  import type { Snippet } from 'svelte';
  import { Button } from '../../../base/button';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    orgName?: OrgLandingPageProps['orgName'];
    hero: OrgLandingPageProps['hero'];
    courses: OrgLandingPageProps['courses'];
    navigation: Snippet;
    showActions?: boolean;
  }

  let { orgName = '', hero, courses = [], navigation, showActions = true }: Props = $props();

  const coursesCount = $derived(courses.length);
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
    class="ui:relative ui:overflow-hidden ui:px-6 ui:pt-16 ui:pb-16 ui:md:pt-20 ui:md:pb-20 ui:bg-[var(--landing-bg)]"
  >
    <div
      class="ui:pointer-events-none ui:absolute ui:inset-x-0 ui:-top-32 ui:h-[680px] ui:opacity-90"
      style="background: radial-gradient(ellipse 60% 70% at 50% 30%, color-mix(in oklab, var(--landing-accent) 22%, transparent) 0%, transparent 65%);"
      aria-hidden="true"
    ></div>

    <div class="ui:relative ui:max-w-[1120px] ui:mx-auto ui:text-center">
      <h1
        class="ui:font-semibold ui:leading-[0.95] ui:mb-10 ui:max-w-[20ch] ui:mx-auto ui:text-balance"
        style="
        font-size: clamp(48px, 9vw, 128px);
        letter-spacing: -0.04em;
        background: linear-gradient(180deg,
          color-mix(in oklab, var(--landing-accent) 60%, #ffffff) 0%,
          color-mix(in oklab, var(--landing-accent) 35%, transparent) 45%,
          color-mix(in oklab, var(--landing-bg) 70%, transparent) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: 0 8px 60px color-mix(in oklab, var(--landing-accent) 18%, transparent);
        user-select: none;
      "
      >
        {hero.heading}
      </h1>

      {#if showActions}
        <div class="ui:inline-flex ui:items-center ui:gap-2 ui:mb-8">
          {#if hero.secondaryAction}
            <Button
              href={hero.secondaryAction.href}
              size="sm"
              variant="outline"
              class="ui:rounded-full ui:px-4 ui:font-medium ui:bg-white/5 ui:border-[var(--landing-border)] ui:text-[var(--landing-fg)] ui:hover:bg-white/10"
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
      {/if}

      <p class="ui:text-[15px] ui:mb-7 ui:max-w-xl ui:mx-auto ui:text-[var(--landing-fg-muted)]">
        {hero.subheading}
      </p>

      {#if coursesCount > 0}
        <span
          class="ui:inline-flex ui:items-center ui:gap-3 ui:px-4 ui:py-2 ui:rounded-full ui:font-mono ui:text-[13px] ui:text-[var(--landing-fg-muted)]"
          style="
          border: 1px solid var(--landing-border);
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(8px);
        "
        >
          <span style="color: var(--landing-accent);">&gt;</span>
          <span
            ><span class="ui:font-medium ui:text-[var(--landing-fg)]">{coursesCount}</span>
            {coursesCount === 1 ? 'course' : 'courses'} running</span
          >
          {#if learnersCount > 0}
            <span class="ui:inline-block ui:w-px ui:h-3 ui:bg-[var(--landing-border)]"></span>
            <span><span class="ui:font-medium ui:text-[var(--landing-fg)]">{learnersFormatted}</span> learners</span>
          {/if}
          {#if tracksCount > 1}
            <span class="ui:inline-block ui:w-px ui:h-3 ui:bg-[var(--landing-border)]"></span>
            <span><span class="ui:font-medium ui:text-[var(--landing-fg)]">{tracksCount}</span> tracks</span>
          {/if}
        </span>
      {/if}

      {#if hero.image}
        <div
          class="ui:mt-14 ui:max-w-[880px] ui:mx-auto ui:rounded-xl ui:overflow-hidden ui:text-left ui:bg-[var(--landing-card)]"
          style="
          border: 1px solid var(--landing-border);
          box-shadow:
            0 30px 90px -30px rgba(0,0,0,0.7),
            0 0 0 1px color-mix(in oklab, var(--landing-accent) 6%, transparent);
        "
        >
          <div
            class="ui:flex ui:items-center ui:gap-2 ui:px-4 ui:py-3 ui:bg-[var(--landing-card-soft)]"
            style="border-bottom: 1px solid var(--landing-border-soft);"
          >
            <span class="ui:flex ui:gap-1.5 ui:mr-2">
              <span class="ui:size-[11px] ui:rounded-full" style="background: #ff5f57;"></span>
              <span class="ui:size-[11px] ui:rounded-full" style="background: #febc2e;"></span>
              <span class="ui:size-[11px] ui:rounded-full" style="background: #28c840;"></span>
            </span>
            <span
              class="ui:flex-1 ui:text-center ui:font-mono ui:text-xs ui:truncate ui:text-[var(--landing-fg-muted)]"
            >
              {orgSlug}/preview
            </span>
          </div>
          <img src={hero.image} alt={orgName} class="ui:block ui:w-full ui:h-auto" />
        </div>
      {:else if terminalRows.length > 0}
        <div
          class="ui:mt-14 ui:max-w-[880px] ui:mx-auto ui:rounded-xl ui:overflow-hidden ui:text-left ui:bg-[var(--landing-card)]"
          style="
          border: 1px solid var(--landing-border);
          box-shadow:
            0 30px 90px -30px rgba(0,0,0,0.7),
            0 0 0 1px color-mix(in oklab, var(--landing-accent) 6%, transparent);
        "
        >
          <div
            class="ui:flex ui:items-center ui:gap-2 ui:px-4 ui:py-3 ui:bg-[var(--landing-card-soft)]"
            style="border-bottom: 1px solid var(--landing-border-soft);"
          >
            <span class="ui:flex ui:gap-1.5 ui:mr-2">
              <span class="ui:size-[11px] ui:rounded-full" style="background: #ff5f57;"></span>
              <span class="ui:size-[11px] ui:rounded-full" style="background: #febc2e;"></span>
              <span class="ui:size-[11px] ui:rounded-full" style="background: #28c840;"></span>
            </span>
            <span
              class="ui:flex-1 ui:text-center ui:font-mono ui:text-xs ui:truncate ui:text-[var(--landing-fg-muted)]"
            >
              {orgSlug}/main · catalog
            </span>
            <span class="ui:font-mono ui:text-[11px] ui:text-[var(--landing-fg-faint)]">
              {coursesCount}
              {coursesCount === 1 ? 'course' : 'courses'}
            </span>
          </div>

          <div class="ui:p-5 ui:font-mono ui:text-[13px] ui:text-[var(--landing-fg)]" style="line-height: 1.7;">
            <div
              class="ui:flex ui:items-baseline ui:gap-2 ui:px-3 ui:py-2 ui:rounded-md ui:mb-3"
              style="background: rgba(255,255,255,0.02); border: 1px solid var(--landing-border-soft);"
            >
              <span style="color: var(--landing-accent);">&gt;</span>
              <span>list courses --org {orgSlug}</span>
            </div>

            <div class="ui:py-1 ui:text-[12px] ui:text-[var(--landing-fg-faint)]">
              ● Loaded {coursesCount}
              {coursesCount === 1 ? 'course' : 'courses'}
            </div>

            <div class="ui:mt-2 ui:flex ui:flex-col">
              {#each terminalRows as row (row.slug)}
                <div class="ui:flex ui:items-baseline ui:gap-4 ui:py-1.5 ui:text-[var(--landing-fg)]">
                  <span class="ui:text-[var(--landing-fg-faint)]">{row.n}</span>
                  <span class="ui:truncate ui:flex-1" style="color: var(--landing-accent);">{row.slug}</span>
                  <span class="ui:text-[12px] ui:text-[var(--landing-fg-muted)]">{row.duration}</span>
                  <span class="ui:text-[12px] ui:w-20 ui:text-right">{row.price}</span>
                </div>
              {/each}
            </div>

            <div class="ui:flex ui:items-baseline ui:gap-2 ui:mt-4">
              <span style="color: var(--landing-accent);">&gt;</span>
              <span
                class="ui:inline-block ui:w-2 ui:h-[14px] ui:align-middle"
                style="background: var(--landing-accent); animation: terminal-caret 1s steps(1) infinite;"
                aria-hidden="true"
              ></span>
            </div>
          </div>

          <div
            class="ui:flex ui:items-center ui:justify-between ui:px-4 ui:py-2.5 ui:font-mono ui:text-[11px] ui:bg-[var(--landing-bg-section)] ui:text-[var(--landing-fg-faint)]"
            style="border-top: 1px solid var(--landing-border-soft);"
          >
            <div class="ui:flex ui:gap-4">
              <span>Enter enroll</span>
              <span>↑/↓ navigate</span>
              <span>^q quit</span>
            </div>
            <div class="ui:text-[var(--landing-fg-muted)]">{orgSlug}-cli</div>
          </div>
        </div>
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
