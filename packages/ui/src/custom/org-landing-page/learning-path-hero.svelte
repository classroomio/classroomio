<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LearningPathHero, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import { safeHref } from './safe-href';
  import CheckIcon from '@lucide/svelte/icons/check';
  import AwardIcon from '@lucide/svelte/icons/award';
  import StarIcon from '@lucide/svelte/icons/star';
  import GitForkIcon from '@lucide/svelte/icons/git-fork';
  import GitBranchIcon from '@lucide/svelte/icons/git-branch';

  interface Props {
    variant: OrgLandingPageTheme;
    orgName?: string;
    hero: LearningPathHero;
    labels?: LearningPathLandingPageLabels;
    navigation?: Snippet;
  }

  let { variant, hero, labels, navigation }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const isFree = $derived(hero.cost === 0);
  const costDisplay = $derived(
    isFree
      ? (labels?.enrollFreeLabel ?? 'Free')
      : hero.currency === 'USD' || !hero.currency
        ? `$${hero.cost}`
        : `${hero.currency} ${hero.cost}`
  );

  const originalCostDisplay = $derived(
    hero.originalCost
      ? hero.currency === 'USD' || !hero.currency
        ? `$${hero.originalCost}`
        : `${hero.currency} ${hero.originalCost}`
      : null
  );

  const savingsAmount = $derived(
    hero.originalCost && hero.cost && hero.originalCost > hero.cost ? hero.originalCost - hero.cost : null
  );

  const savingsPercent = $derived(
    hero.originalCost && savingsAmount ? Math.round((savingsAmount / hero.originalCost) * 100) : null
  );

  const instructorsText = $derived.by(() => {
    if (!hero.instructors || hero.instructors.length === 0) return null;
    const names = hero.instructors.map((i) => i.name);
    if (names.length <= 2) return `Taught by ${names.join(' and ')}`;
    return `Taught by ${names.slice(0, 2).join(', ')} + ${names.length - 2} more`;
  });

  const defaultFeatures = $derived([
    `All ${hero.courseCount ?? 5} courses, unlocked in order`,
    '52 lessons · 13 exercises · 1 capstone',
    hero.hasCertificate ? 'Path certificate on completion' : 'Verified path milestone completion',
    'Lifetime access, learn at your pace'
  ]);

  const features = $derived(hero.features && hero.features.length > 0 ? hero.features : defaultFeatures);
</script>

<header class="ui:relative ui:bg-[var(--landing-bg)] ui:border-b ui:border-[var(--landing-border)] ui:overflow-hidden">
  {#if navigation}
    <div class="ui:relative ui:max-w-[1200px] ui:mx-auto ui:px-4 ui:sm:px-6 ui:pt-4">
      {@render navigation()}
    </div>
  {/if}

  <div class="ui:max-w-[1200px] ui:mx-auto ui:px-4 ui:sm:px-6 ui:py-12 ui:lg:py-16">
    <div class="ui:grid ui:grid-cols-1 ui:lg:grid-cols-12 ui:gap-8 ui:lg:gap-12 ui:items-start">
      <!-- Left Column: Headline, Instructors, CTA, Stats -->
      <div class="ui:lg:col-span-7 ui:flex ui:flex-col ui:gap-6">
        <!-- Chip/Badge -->
        <div>
          <span
            class="ui:inline-flex ui:items-center ui:gap-1.5 ui:text-xs ui:font-semibold ui:[letter-spacing:0.06em] ui:uppercase ui:text-[var(--landing-accent)] ui:bg-[var(--landing-panel-bg-accent)] ui:px-2.5 ui:py-1"
          >
            <GitBranchIcon class="ui:size-3.5 ui:text-[var(--landing-accent)]" />
            <span>{hero.chip ?? 'Learning Path · Certificate'}</span>
          </span>
        </div>

        <!-- Heading & Subheading -->
        <div>
          <h1
            class="ui:text-3xl ui:sm:text-4xl ui:lg:text-5xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)] ui:leading-[1.1] ui:mb-4"
          >
            {hero.heading}
          </h1>
          <p class="ui:text-base ui:sm:text-lg ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:max-w-2xl">
            {hero.subheading}
          </p>
        </div>

        <!-- Instructors Stack -->
        {#if hero.instructors && hero.instructors.length > 0}
          <div class="ui:flex ui:items-center ui:gap-3 ui:text-sm ui:text-[var(--landing-fg-muted)]">
            <div class="ui:flex ui:-space-x-2 ui:overflow-hidden">
              {#each hero.instructors.slice(0, 3) as instructor (instructor.id)}
                {#if instructor.avatarUrl}
                  <img
                    src={instructor.avatarUrl}
                    alt={instructor.name}
                    class="ui:inline-block ui:size-8 ui:rounded-full ui:ring-2 ui:ring-[var(--landing-bg)] ui:object-cover"
                  />
                {:else}
                  <span
                    class="ui:inline-flex ui:items-center ui:justify-center ui:size-8 ui:rounded-full ui:bg-[var(--landing-accent)]/15 ui:text-[var(--landing-accent)] ui:text-xs ui:font-semibold ui:ring-2 ui:ring-[var(--landing-bg)]"
                  >
                    {instructor.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                {/if}
              {/each}
            </div>
            <span>{instructorsText}</span>
          </div>
        {/if}

        <!-- CTA Row -->
        <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-4 ui:pt-2">
          <a
            href={safeHref(hero.primaryAction?.href ?? '#pricing')}
            class="ui:inline-flex ui:items-center ui:justify-center ui:px-6 ui:py-3.5 ui:text-base ui:font-semibold ui:text-[var(--landing-accent-fg)] ui:bg-[var(--landing-accent)] ui:[border-radius:var(--landing-radius-button)] ui:hover:opacity-95 ui:transition-all ui:shadow-md"
          >
            {hero.primaryAction?.label ?? `Enroll · ${costDisplay}`}
          </a>
          {#if savingsAmount}
            <span
              class="ui:inline-flex ui:items-center ui:px-3 ui:py-2 ui:text-xs ui:font-semibold ui:bg-[var(--landing-accent)]/10 ui:text-[var(--landing-accent)]"
            >
              Save ${savingsAmount} vs individual courses
            </span>
          {/if}
        </div>

        <!-- Hero Stats Row (No Hours!) -->
        <div
          class="ui:grid ui:grid-cols-2 ui:sm:grid-cols-4 ui:gap-4 ui:pt-8 ui:mt-4 ui:border-t ui:border-[var(--landing-border)]"
        >
          <div class="ui:flex ui:flex-col">
            <span class="ui:text-2xl ui:font-semibold ui:text-[var(--landing-fg)] ui:font-mono">
              {hero.courseCount ?? 5}
            </span>
            <span class="ui:text-xs ui:text-[var(--landing-fg-muted)] ui:uppercase ui:tracking-wider ui:mt-0.5">
              courses in series
            </span>
          </div>

          <div class="ui:flex ui:flex-col">
            <span class="ui:text-2xl ui:font-semibold ui:text-[var(--landing-fg)] ui:font-mono">
              {hero.totalStudents ?? 942}
            </span>
            <span class="ui:text-xs ui:text-[var(--landing-fg-muted)] ui:uppercase ui:tracking-wider ui:mt-0.5">
              enrolled
            </span>
          </div>

          <div class="ui:flex ui:flex-col">
            <span class="ui:text-2xl ui:font-semibold ui:text-[var(--landing-fg)]">
              {hero.hasCertificate ? 'Certificate' : 'Beginner'}
            </span>
            <span class="ui:text-xs ui:text-[var(--landing-fg-muted)] ui:uppercase ui:tracking-wider ui:mt-0.5">
              {hero.hasCertificate ? 'on completion' : 'no prior exp.'}
            </span>
          </div>

          <div class="ui:flex ui:flex-col">
            <span class="ui:text-2xl ui:font-semibold ui:text-[var(--landing-fg)] ui:flex ui:items-center ui:gap-1">
              <StarIcon class="ui:size-5 ui:fill-amber-400 ui:text-amber-400" />
              <span>{hero.rating ?? 4.7}</span>
            </span>
            <span class="ui:text-xs ui:text-[var(--landing-fg-muted)] ui:uppercase ui:tracking-wider ui:mt-0.5">
              {hero.reviewsCount ?? 213} reviews
            </span>
          </div>
        </div>
      </div>

      <!-- Right Column: Sticky Enroll Box -->
      <aside class="ui:lg:col-span-5 ui:w-full">
        <div
          class="ui:sticky ui:top-20 ui:p-6 ui:sm:p-8 ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:flex ui:flex-col ui:gap-6"
        >
          <div>
            <span class="ui:text-xs ui:font-semibold ui:uppercase ui:tracking-widest ui:text-[var(--landing-fg-muted)]">
              Full path
            </span>
            <div class="ui:flex ui:items-baseline ui:gap-3 ui:mt-2">
              <span
                class="ui:text-4xl ui:sm:text-5xl ui:font-bold ui:text-[var(--landing-fg)] ui:tracking-tight ui:font-mono"
              >
                {costDisplay}
              </span>
              {#if originalCostDisplay && savingsPercent}
                <span class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:line-through">
                  {originalCostDisplay}
                </span>
                <span
                  class="ui:text-xs ui:font-semibold ui:px-2 ui:py-0.5 ui:bg-[var(--landing-accent)]/10 ui:text-[var(--landing-accent)]"
                >
                  Save {savingsPercent}%
                </span>
              {/if}
            </div>
          </div>

          <ul class="ui:flex ui:flex-col ui:gap-3 ui:text-sm ui:text-[var(--landing-fg)]">
            {#each features as feature}
              <li class="ui:flex ui:items-start ui:gap-2.5">
                <CheckIcon class="ui:size-4 ui:shrink-0 ui:text-[var(--landing-accent)] ui:mt-0.5" />
                <span>{feature}</span>
              </li>
            {/each}
          </ul>

          <div class="ui:flex ui:flex-col ui:gap-2">
            <a
              href={safeHref(hero.primaryAction?.href ?? '#pricing')}
              class="ui:w-full ui:inline-flex ui:items-center ui:justify-center ui:px-6 ui:py-3.5 ui:text-base ui:font-semibold ui:text-[var(--landing-accent-fg)] ui:bg-[var(--landing-accent)] ui:[border-radius:var(--landing-radius-button)] ui:hover:opacity-95 ui:transition-all ui:text-center ui:shadow-md"
            >
              {labels?.enrollPathLabel ?? 'Enroll in this path'}
            </a>
            <p class="ui:text-xs ui:text-[var(--landing-fg-muted)] ui:text-center">
              {hero.totalStudents ?? 942} already enrolled · {hero.rating ?? 4.7} ★ from {hero.reviewsCount ?? 213} reviews
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</header>
