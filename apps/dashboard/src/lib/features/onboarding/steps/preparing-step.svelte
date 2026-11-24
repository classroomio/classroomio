<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { Alert, AlertDescription, AlertTitle } from '@cio/ui/base/alert';
  import { HighlightText } from '@cio/ui/custom/highlight-text';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { STARTER_JOB_STAGES } from '@cio/utils/constants/onboarding';
  import OnboardingLogo from '$features/onboarding/components/onboarding-logo.svelte';
  import TestimonialPanel from '$features/onboarding/components/testimonial-panel.svelte';
  import { onboardingFlowApi } from '$features/onboarding/api/onboarding-flow.svelte';
  import { buildHeadingKey, CourseBuildProgress, gateReasonKey } from '$features/course-build';

  const ROWS = ['understanding', 'drafting', 'organising', 'finishing'] as const;
  type RowId = (typeof ROWS)[number];

  const ROW_LABELS: Record<RowId, string> = {
    understanding: 'onboarding.v2.preparing.rows.understanding',
    drafting: 'onboarding.v2.preparing.rows.drafting',
    organising: 'onboarding.v2.preparing.rows.organising',
    finishing: 'onboarding.v2.preparing.rows.finishing'
  };

  const HEADINGS: Record<RowId, string> = {
    understanding: 'onboarding.v2.preparing.headings.understanding',
    drafting: 'onboarding.v2.preparing.headings.drafting',
    organising: 'onboarding.v2.preparing.headings.organising',
    finishing: 'onboarding.v2.preparing.headings.finishing'
  };

  const HIGHLIGHTS: Record<RowId, string> = {
    understanding: 'onboarding.v2.preparing.headings_highlight.understanding',
    drafting: 'onboarding.v2.preparing.headings_highlight.drafting',
    organising: 'onboarding.v2.preparing.headings_highlight.organising',
    finishing: 'onboarding.v2.preparing.headings_highlight.finishing'
  };

  let now = $state(Date.now());

  const starter = $derived(onboardingFlowApi.starter);
  const isSample = $derived(starter?.mode === 'sample');
  const build = $derived(starter?.mode === 'website' ? starter.build : null);
  const buildHeading = $derived(build ? buildHeadingKey(build) : null);
  const buildBody = $derived(
    !build
      ? 'course_build.continue_hint'
      : build.status === 'NOTHING_TO_BUILD'
        ? gateReasonKey(build.gateReason)
        : build.status === 'FAILED' || build.status === 'CANCELED'
          ? 'course_build.failed_body'
          : 'course_build.continue_hint'
  );

  const currentRow = $derived.by<RowId>(() => {
    const stage = starter?.stage ?? 'queued';
    const index = STARTER_JOB_STAGES.indexOf(stage);
    if (index <= STARTER_JOB_STAGES.indexOf('understanding')) return 'understanding';

    return ROWS[Math.min(index - 1, ROWS.length - 1)];
  });

  const isTerminal = $derived(Boolean(starter && starter.status !== 'PENDING' && starter.status !== 'RUNNING'));

  const canContinue = $derived(onboardingFlowApi.isStarterReady(now));

  const failed = $derived(starter?.status === 'FAILED');
  const hasDrafts = $derived((starter?.drafts.length ?? 0) > 0);
  const warning = $derived(starter?.warning ?? null);

  const orgName = $derived(
    onboardingFlowApi.state?.organization?.name ?? onboardingFlowApi.state?.brand.productName ?? ''
  );

  function rowState(row: RowId): 'done' | 'now' | 'waiting' {
    const rowIndex = ROWS.indexOf(row);
    const currentIndex = ROWS.indexOf(currentRow);

    if (isTerminal) return 'done';
    if (rowIndex < currentIndex) return 'done';
    if (rowIndex === currentIndex) return 'now';

    return 'waiting';
  }

  async function handleContinue() {
    await goto(resolve('/onboarding/customise', {}));
  }

  async function handleRegenerate() {
    await onboardingFlowApi.regenerateStarter();
  }

  onMount(() => {
    const controller = new AbortController();

    void onboardingFlowApi.refreshStarter().then(() => onboardingFlowApi.pollStarter(controller.signal));

    const ticker = setInterval(() => {
      now = Date.now();
    }, 1000);

    return () => {
      controller.abort();
      clearInterval(ticker);
    };
  });
</script>

<svelte:head>
  <title>{$t('onboarding.v2.preparing.title')}</title>
</svelte:head>

<div class="ui:bg-background grid min-h-screen grid-cols-1 lg:grid-cols-2" data-testid="onboarding-preparing">
  <section class="relative isolate flex min-w-0 flex-col justify-center px-6 pt-24 pb-6 lg:px-[8vw] lg:pt-20 lg:pb-16">
    <div class="prep-wash absolute inset-0 -z-20" aria-hidden="true"></div>
    <div class="prep-dots absolute inset-0 -z-10" aria-hidden="true"></div>

    <OnboardingLogo class="absolute top-7 left-6 pt-0 md:pt-0 lg:left-[8vw]" />

    {#if build && buildHeading}
      <h2
        class="mt-3.5 text-[clamp(36px,4.4vw,60px)] leading-[1.02] font-extrabold tracking-[-0.05em] text-balance"
        aria-live="polite"
      >
        <HighlightText variant="swipe" text={$t(buildHeading)} highlight={$t(`${buildHeading}_highlight`)} />
      </h2>

      <p class="ui:text-muted-foreground mt-3.5 max-w-[30rem] text-[18px] leading-[1.5]">
        {$t(buildBody)}
      </p>

      <div class="mt-8 max-w-[30rem]">
        <CourseBuildProgress {build} />
      </div>

      <Button class="mt-8 w-full sm:w-fit" onclick={handleContinue} testId="onboarding-preparing-continue">
        {$t('onboarding.v2.common.continue')}
        <ArrowRightIcon class="custom size-4" aria-hidden="true" />
      </Button>
    {:else}
      <p class="ui:text-muted-foreground font-mono text-xs tracking-[0.12em] uppercase">
        {$t('onboarding.v2.preparing.counter', {
          current: String(ROWS.indexOf(currentRow) + 1),
          total: String(ROWS.length)
        })}
      </p>

      <h2
        class="mt-3.5 text-[clamp(36px,4.4vw,60px)] leading-[1.02] font-extrabold tracking-[-0.05em] text-balance"
        aria-live="polite"
      >
        <HighlightText variant="swipe" text={$t(HEADINGS[currentRow])} highlight={$t(HIGHLIGHTS[currentRow])} />
      </h2>

      <p class="ui:text-muted-foreground mt-3.5 max-w-[30rem] text-[18px] leading-[1.5]">
        {$t(isSample ? 'onboarding.v2.preparing.subtitle_sample' : 'onboarding.v2.preparing.subtitle', { orgName })}
      </p>

      <ol class="mt-8 max-w-[30rem]" aria-label={$t('onboarding.v2.preparing.checklist_label')}>
        {#each ROWS as row (row)}
          {@const status = rowState(row)}
          <li
            class="prep-step flex items-center gap-3 border-t py-[13px] text-[15px] last:border-b"
            class:now={status === 'now'}
            class:done={status === 'done'}
            aria-current={status === 'now' ? 'step' : undefined}
          >
            <i class="grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-current">
              <CheckIcon class="custom size-2.5" aria-hidden="true" />
            </i>
            <span class="flex-1">{$t(ROW_LABELS[row])}</span>
            <em class="font-mono text-[11px] tracking-[0.1em] uppercase not-italic">
              {#if status === 'done'}
                {$t('onboarding.v2.preparing.states.done')}
              {:else if status === 'now'}
                {$t('onboarding.v2.preparing.states.now')}
              {/if}
            </em>
          </li>
        {/each}
      </ol>

      {#if warning === 'WEBSITE_UNREADABLE'}
        <Alert class="mt-6 max-w-[30rem]">
          <AlertTitle>{$t('onboarding.v2.preparing.warning.title')}</AlertTitle>
          <AlertDescription>{$t('onboarding.v2.preparing.warning.body')}</AlertDescription>
        </Alert>
      {:else if failed && hasDrafts}
        <Alert class="mt-6 max-w-[30rem]">
          <AlertTitle>{$t('onboarding.v2.preparing.failed_partial.title')}</AlertTitle>
          <AlertDescription>{$t('onboarding.v2.preparing.failed_partial.body')}</AlertDescription>
        </Alert>
      {:else if failed && !hasDrafts}
        <Alert variant="destructive" class="mt-6 max-w-[30rem]">
          <AlertTitle>{$t('onboarding.v2.preparing.failed.title')}</AlertTitle>
          <AlertDescription>{$t('onboarding.v2.preparing.failed.body')}</AlertDescription>
        </Alert>
      {/if}

      {#if canContinue}
        <Button class="mt-8 w-full sm:w-fit" onclick={handleContinue} testId="onboarding-preparing-continue">
          {$t('onboarding.v2.common.continue')}
          <ArrowRightIcon class="custom size-4" aria-hidden="true" />
        </Button>
      {:else if failed && !hasDrafts}
        <div class="mt-8 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onclick={handleRegenerate}>
            {$t('onboarding.v2.preparing.try_again')}
          </Button>
          <Button variant="outline" size="sm" onclick={handleContinue}>
            {$t('onboarding.v2.preparing.continue_without')}
          </Button>
        </div>
      {/if}
    {/if}
  </section>

  <TestimonialPanel />
</div>

<style>
  .prep-wash {
    background: linear-gradient(180deg, #e8eeff 0%, #f1f0fa 46%, #fafafa 100%);
  }

  :global(.dark) .prep-wash {
    background: linear-gradient(
      180deg,
      color-mix(in oklab, var(--primary) 14%, var(--background)) 0%,
      color-mix(in oklab, var(--primary) 6%, var(--background)) 46%,
      var(--background) 100%
    );
  }

  .prep-dots {
    background-image: radial-gradient(rgb(2 51 189 / 0.16) 1.2px, transparent 1.2px);
    background-size: 18px 18px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 0%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 0%, transparent 75%);
    pointer-events: none;
  }

  :global(.dark) .prep-dots {
    background-image: radial-gradient(color-mix(in oklab, var(--primary) 32%, transparent) 1.2px, transparent 1.2px);
  }

  .prep-step {
    color: var(--muted-foreground);
    transition: color 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .prep-step i svg {
    opacity: 0;
  }

  .prep-step em {
    color: var(--muted-foreground);
  }

  .prep-step.now {
    color: var(--foreground);
  }

  .prep-step.now i {
    border-style: dashed;
    animation: prep-spin 2.4s linear infinite;
  }

  .prep-step.now em {
    color: var(--primary);
  }

  .prep-step.done {
    color: color-mix(in oklab, var(--foreground) 82%, var(--background));
  }

  .prep-step.done i {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--primary-foreground);
  }

  .prep-step.done i svg {
    opacity: 1;
  }

  @keyframes prep-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .prep-step.now i {
      animation: none;
    }
  }
</style>
